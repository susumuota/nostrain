// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

// node examples/relay.js

import crypto from 'node:crypto';
globalThis.crypto = crypto;

import 'websocket-polyfill';
import { relayInit, generatePrivateKey, getPublicKey, getEventHash, signEvent } from 'nostrain';

const relay = relayInit('wss://relay.damus.io');

relay.on('connect', () => {
  console.log(`connected to ${relay.url}`);
});
relay.on('error', () => {
  console.log(`failed to connect to ${relay.url}`);
});

await relay.connect();

{
  // let's query for an event that exists
  const sub = relay.sub([{ ids: ['d7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027'] }]);

  sub.on('event', event => {
    console.log('we got the event we wanted:', event);
  });
  sub.on('eose', () => {
    sub.unsub();
  });
}

{
  // let's publish a new event while simultaneously monitoring the relay for it
  const sk = generatePrivateKey();
  const pk = getPublicKey(sk);

  const sub = relay.sub([{ kinds: [1], authors: [pk] }]);

  sub.on('event', event => {
    console.log('got event:', event);
  });

  const event = {
    kind: 1,
    pubkey: pk,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: 'hello world',
  };
  event.id = getEventHash(event);
  event.sig = signEvent(event, sk);

  const pub = relay.publish(event);
  pub.on('ok', () => {
    console.log(`${relay.url} has accepted our event`);
  });
  pub.on('failed', reason => {
    console.log(`failed to publish to ${relay.url}: ${reason}`);
  });
}

{
  // let's query for events by list and get
  const events = await relay.list([{ kinds: [0, 1] }]);
  console.log(events.length);

  const event = await relay.get({ ids: ['d7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027'] });
  console.log({ event });
}

relay.close();
