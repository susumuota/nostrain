// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import type { Event } from './event';
import type { Filter } from './filter';

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
  | ['OK', EventId, boolean, string] // TODO: https://github.com/nostr-protocol/nips/blob/master/20.md
  | ['AUTH', Event];

type Subscription = {
  id: SubscriptionId;
  request: Message;
  listener: (ev: MessageEvent) => any;
  timer: NodeJS.Timeout | number | undefined;
};

class Relay {
  #ws: WebSocket;
  #subs: Map<SubscriptionId, Subscription>;

  constructor(url: string) {
    this.#ws = new WebSocket(url);
    this.#subs = new Map<SubscriptionId, Subscription>();
  }

  isConnect() {
    return this.#ws.readyState === WebSocket.OPEN;
  }

  close() {
    if (this.isConnect()) this.#ws.close();
  }

  #addSubscription(id: SubscriptionId, sub: Subscription) {
    if (this.#subs.has(id)) throw new Error('subscription already exists');
    this.#ws.addEventListener('message', sub.listener);
    this.#subs.set(id, sub);
  }

  #removeSubscription(id: SubscriptionId) {
    const sub = this.#subs.get(id);
    if (!sub) throw new Error('no subscription');
    this.#ws.removeEventListener('message', sub.listener);
    if (sub.timer !== undefined) clearTimeout(sub.timer);
    this.#subs.delete(id);
  }

  send(
    id: SubscriptionId,
    request: Message,
    onMessage: (response: Message) => any,
    onTimeout: () => any,
    timeout: number = -1,
  ) {
    if (!this.isConnect()) throw new Error('not connected');
    return new Promise<any>((resolve, reject) => {
      const listener = (ev: MessageEvent) => {
        try {
          const response: Message = JSON.parse(ev.data);
          const result = onMessage(response);
          if (result !== undefined) {
            // TODO: is it OK to use undefined like this?
            this.#removeSubscription(id);
            resolve(result);
          }
        } catch (err: any) {
          this.#removeSubscription(id);
          reject(err);
        }
      };
      const timer =
        timeout < 0
          ? undefined
          : setTimeout(() => {
              const result = onTimeout();
              this.#removeSubscription(id);
              result !== undefined ? resolve(result) : reject(new Error('timeout'));
            }, timeout);
      this.#addSubscription(id, { id, request, listener, timer });
      this.#ws.send(JSON.stringify(request));
    });
  }

  subscribe(
    filters: Filter[],
    onEvent: (event: Event) => any,
    onEOSE: () => any,
    onTimeout: () => any,
    timeout: number = -1,
  ) {
    const subId = crypto.randomUUID();
    const onMessage = (response: Message) => {
      if (response[0] === 'EOSE' && response[1] === subId) return onEOSE();
      if (response[0] === 'EVENT' && response[1] === subId && response[2]) return onEvent(response[2]);
      return undefined;
    };
    return this.send(subId, ['REQ', subId, ...filters], onMessage, onTimeout, timeout);
  }

  list(filters: Filter[], timeout: number = -1) {
    const events: Event[] = [];
    const onEvent = (event: Event) => {
      events.push(event);
      return undefined;
    };
    return this.subscribe(
      filters,
      onEvent,
      () => events,
      () => events,
      timeout,
    );
  }

  get(filters: Filter[], timeout: number = -1) {
    return this.subscribe(
      filters,
      event => event,
      () => null,
      () => null,
      timeout,
    );
  }

  publish(event: Event, timeout: number = -1) {
    const onMessage = (response: Message) =>
      response[0] === 'OK' && response[1] === event.id ? { success: response[2], message: response[3] } : undefined;
    return this.send(event.id, ['EVENT', event], onMessage, () => undefined, timeout);
  }
}

export { Relay };
