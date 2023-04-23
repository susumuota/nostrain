// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { webcrypto } from 'one-webcrypto';

import type { Event } from './event';
import type { Filter } from './filter';

// TODO: implement SubscriptionOptions

// Nostr message types
// https://github.com/nostr-protocol/nips/blob/master/README.md#message-types
type SubscriptionId = string;
type EventId = string;
type Challenge = string;
type Message =
  // Client to Relay
  | ['EVENT', Event]
  | ['REQ', SubscriptionId, ...Filter[]]
  | ['CLOSE', SubscriptionId]
  | ['AUTH', Challenge]
  // Relay to Client
  | ['EVENT', SubscriptionId, Event]
  | ['NOTICE', string] // human-readable error messages or other things to clients.
  | ['EOSE', SubscriptionId]
  | ['OK', EventId, boolean, string] // https://github.com/nostr-protocol/nips/blob/master/20.md
  | ['AUTH', Event];

// WebSocket event types
// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#events
type WebSocketEventType = 'open' | 'close' | 'error' | 'message'; // TODO: derive from Relay.EVENT_TYPES?
type WebSocketEventListener = (ev: globalThis.Event | globalThis.CloseEvent | globalThis.MessageEvent<any>) => any;

// Timer type for setTimeout
type Timer = NodeJS.Timeout | number | null;

// client implementation to access Nostr Relay (not implementation of Relay)
class Relay {
  static readonly EVENT_TYPES = ['open', 'close', 'error', 'message'];

  #url: string;
  #ws: WebSocket;
  #listeners: Map<WebSocketEventType, WebSocketEventListener[]>;

  constructor(url: string) {
    this.#url = url;
    this.#ws = undefined as unknown as WebSocket;
    this.#listeners = new Map<WebSocketEventType, WebSocketEventListener[]>(
      Relay.EVENT_TYPES.map(t => [t, []] as [WebSocketEventType, WebSocketEventListener[]]),
    );
  }

  close() {
    if (!this.connected()) throw new Error('not connected');
    this.#ws.close();
  }

  connected() {
    return this.#ws && this.#ws.readyState === WebSocket.OPEN;
  }

  get url() {
    return this.#url;
  }

  // send Nostr message to the relay
  send(request: Message) {
    if (!this.connected()) throw new Error('not connected');
    this.#ws.send(JSON.stringify(request));
  }

  // add event listener
  on(type: WebSocketEventType | 'connect' | 'disconnect', listener: WebSocketEventListener) {
    const t = type === 'connect' ? 'open' : type === 'disconnect' ? 'close' : type; // compatible with nostr-tools
    this.#listeners.set(t, [...(this.#listeners.get(t) ?? []), listener]);
  }

  // remove event listener
  off(type: WebSocketEventType | 'connect' | 'disconnect', listener: WebSocketEventListener) {
    const t = type === 'connect' ? 'open' : type === 'disconnect' ? 'close' : type; // compatible with nostr-tools
    this.#listeners.set(t, (this.#listeners.get(t) ?? []).filter(l => l !== listener)); // prettier-ignore
  }

  // connect to the relay and wait for the connection to be established
  connect(timeout: number = -1) {
    return new Promise<void>((resolve, reject) => {
      // reject if already connected
      if (this.connected()) reject(new Error('already connected'));
      // create WebSocket
      try {
        this.#ws = new WebSocket(this.#url);
      } catch (err: any) {
        reject(err);
      }
      // set listeners
      this.#ws.onopen = (ev: globalThis.Event) =>
        this.#listeners.get('open')?.map(listener => (listener as WebSocketEventListener)(ev));
      this.#ws.onclose = (ev: globalThis.CloseEvent) =>
        this.#listeners.get('close')?.map(listener => (listener as WebSocketEventListener)(ev));
      this.#ws.onerror = (ev: globalThis.Event) =>
        this.#listeners.get('error')?.map(listener => (listener as WebSocketEventListener)(ev));
      this.#ws.onmessage = (ev: globalThis.MessageEvent) =>
        this.#listeners.get('message')?.map(listener => (listener as WebSocketEventListener)(ev));
      // wait for open
      const openListener = () => { cleanup(); resolve(); }; // prettier-ignore
      const errorListener = (ev: globalThis.Event) => { cleanup(); reject(ev); }; // prettier-ignore
      let timer: Timer = timeout < 0 ? null : setTimeout(() => { cleanup(); reject(new Error('timeout')); }, timeout); // prettier-ignore
      const cleanup = () => {
        this.off('open', openListener);
        this.off('error', errorListener);
        if (timer) clearTimeout(timer);
        timer = null;
      };
      this.on('open', openListener);
      this.on('error', errorListener);
    });
  }

  // send 'REQ' and accumulate 'EVENT' until 'EOSE' or timeout, then return the list of events
  list(filters: Filter[], timeout: number = -1) {
    return new Promise<Event[]>((resolve, reject) => {
      const events: Event[] = [];
      const s = new Sub(this);
      s.on('event', (event: Event) => events.push(event)); // prettier-ignore
      s.on('eose', () => { cleanup(); resolve(events); }); // prettier-ignore
      s.on('notice', (message: string) => { cleanup(); reject(message); }); // prettier-ignore
      s.on('error', (err: any) => { cleanup(); reject(err); }); // prettier-ignore
      let timer: Timer = timeout < 0 ? null : setTimeout(() => { cleanup(); resolve(events); }, timeout); // prettier-ignore
      const cleanup = () => {
        s.unsub();
        if (timer) clearTimeout(timer);
        timer = null;
      };
      s.sub(filters);
    });
  }

  // send 'REQ' and wait for 'EVENT', 'EOSE' or timeout, then return the first event
  get(filter: Filter, timeout: number = -1) {
    return new Promise<Event | null>((resolve, reject) => {
      const s = new Sub(this);
      s.on('event', (event: Event) => { cleanup(); resolve(event); }); // prettier-ignore
      s.on('eose', () => { cleanup(); resolve(null); }); // prettier-ignore
      s.on('notice', (message: string) => { cleanup(); reject(message); }); // prettier-ignore
      s.on('error', (err: any) => { cleanup(); reject(err); }); // prettier-ignore
      let timer: Timer = timeout < 0 ? null : setTimeout(() => { cleanup(); resolve(null); }, timeout); // prettier-ignore
      const cleanup = () => {
        s.unsub();
        if (timer) clearTimeout(timer);
        timer = null;
      };
      s.sub([filter]);
    });
  }

  // send 'REQ' and handle 'EVENT' or 'EOSE' until unsub is called
  sub(filters: Filter[]) {
    const s = new Sub(this);
    s.sub(filters);
    return s;
  }

  // send 'EVENT' and wait for 'OK' or timeout
  publish(event: Event) {
    const p = new Pub(this);
    p.pub(event);
    return p;
  }
}

// client send 'REQ' and receive 'EVENT' or 'EOSE' from the relay
type SubEventType = 'event' | 'eose' | 'notice' | 'error'; // TODO: derive from Sub.EVENT_TYPES?
type SubEventListener = ((event: Event) => any) | (() => any) | ((message: string) => any) | ((err: any) => any);

class Sub {
  static readonly EVENT_TYPES = ['event', 'eose', 'notice', 'error'];

  #relay: Relay;
  #id: SubscriptionId;
  #filters: Filter[];
  #messageListener: WebSocketEventListener;
  #subListeners: Map<SubEventType, SubEventListener[]>;

  constructor(relay: Relay) {
    this.#relay = relay;
    this.#id = undefined as unknown as SubscriptionId;
    this.#filters = [];
    this.#messageListener = undefined as unknown as WebSocketEventListener;
    this.#subListeners = new Map<SubEventType, SubEventListener[]>(
      Sub.EVENT_TYPES.map(t => [t, []] as [SubEventType, SubEventListener[]]),
    );
  }

  // add message event listener
  on(type: SubEventType, listener: SubEventListener) {
    this.#subListeners.set(type, [...(this.#subListeners.get(type) ?? []), listener]);
  }

  // remove message event listener
  off(type: SubEventType, listener: SubEventListener) {
    this.#subListeners.set(type, (this.#subListeners.get(type) ?? []).filter(l => l !== listener)); // prettier-ignore
  }

  // send 'REQ' and handle 'EVENT' or 'EOSE' until unsub is called
  sub(filters: Filter[]) {
    if (!this.#relay.connected()) throw new Error('not connected');
    this.#id = webcrypto.randomUUID();
    this.#filters = filters;
    this.#messageListener = ((ev: globalThis.MessageEvent) => {
      try {
        const response = JSON.parse(ev.data) as Message;
        if (response[0] === 'EVENT' && response[1] === this.#id && response[2]) {
          this.#subListeners.get('event')?.map(listener => listener(response[2] as Event));
        } else if (response[0] === 'EOSE' && response[1] === this.#id) {
          this.#subListeners.get('eose')?.map(listener => (listener as () => any)());
        } else if (response[0] === 'NOTICE' && response[1]) {
          this.#subListeners.get('notice')?.map(listener => listener(response[1]));
        }
      } catch (err: any) {
        this.#subListeners.get('error')?.map(listener => listener(err));
      }
    }) as WebSocketEventListener;
    this.#relay.on('message', this.#messageListener);
    this.#relay.send(['REQ', this.#id, ...this.#filters]);
  }

  // send 'CLOSE' and cleanup
  unsub() {
    if (this.#relay.connected()) this.#relay.send(['CLOSE', this.#id]);
    this.#relay.off('message', this.#messageListener);
    this.#messageListener = undefined as unknown as WebSocketEventListener;
    this.#filters = [];
    this.#id = undefined as unknown as SubscriptionId;
    this.#subListeners.clear();
    this.#subListeners = new Map<SubEventType, SubEventListener[]>(
      Sub.EVENT_TYPES.map(t => [t, []] as [SubEventType, SubEventListener[]]),
    );
  }
}

// client send 'EVENT' and receive 'OK' from the relay
type PubEventType = 'ok' | 'failed' | 'notice' | 'error'; // TODO: derive from Pub.EVENT_TYPES?
type PubEventListener = ((message: string) => any) | ((err: any) => any);

class Pub {
  static readonly EVENT_TYPES = ['ok', 'failed', 'notice', 'error'];

  #relay: Relay;
  #event: Event;
  #messageListener: WebSocketEventListener;
  #pubListeners: Map<PubEventType, PubEventListener[]>;

  constructor(relay: Relay) {
    this.#relay = relay;
    this.#event = undefined as unknown as Event;
    this.#messageListener = undefined as unknown as WebSocketEventListener;
    this.#pubListeners = new Map<PubEventType, PubEventListener[]>(
      Pub.EVENT_TYPES.map(t => [t, []] as [PubEventType, PubEventListener[]]),
    );
  }

  // add message event listener
  on(type: PubEventType, listener: PubEventListener) {
    this.#pubListeners.set(type, [...(this.#pubListeners.get(type) ?? []), listener]);
  }

  // remove message event listener
  off(type: PubEventType, listener: PubEventListener) {
    this.#pubListeners.set(type, (this.#pubListeners.get(type) ?? []).filter(l => l !== listener)); // prettier-ignore
  }

  // send 'EVENT' and handle 'OK' or 'NOTICE'
  pub(event: Event) {
    if (!this.#relay.connected()) throw new Error('not connected');
    this.#event = event;
    this.#messageListener = ((ev: globalThis.MessageEvent) => {
      try {
        const response = JSON.parse(ev.data) as Message;
        if (response[0] === 'OK' && response[1] === this.#event.id) {
          const [_, __, success, message] = response;
          this.#pubListeners.get(success ? 'ok' : 'failed')?.map(listener => listener(message));
          this.#cleanup();
        } else if (response[0] === 'NOTICE' && response[1]) {
          this.#pubListeners.get('notice')?.map(listener => listener(response[1]));
          this.#cleanup();
        }
      } catch (err: any) {
        this.#pubListeners.get('error')?.map(listener => listener(err));
        this.#cleanup();
      }
    }) as WebSocketEventListener;
    this.#relay.on('message', this.#messageListener);
    this.#relay.send(['EVENT', this.#event]);
  }

  // cleanup
  #cleanup() {
    this.#relay.off('message', this.#messageListener);
    this.#event = undefined as unknown as Event;
    this.#messageListener = undefined as unknown as WebSocketEventListener;
    this.#pubListeners.clear();
    this.#pubListeners = new Map<PubEventType, PubEventListener[]>(
      Pub.EVENT_TYPES.map(t => [t, []] as [PubEventType, PubEventListener[]]),
    );
  }
}

const relayInit = (url: string) => new Relay(url);

export { Relay, Sub, Pub, relayInit };
