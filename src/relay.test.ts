// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { test, expect, beforeAll, afterAll } from 'vitest';

import 'websocket-polyfill';
import { relayInit, generatePrivateKey, getPublicKey, getEventHash, signEvent } from '../dist/nostrain';

const relay = relayInit('wss://relay.damus.io');
//const relay = relayInit('wss://relay.snort.social');
//const relay = relayInit('wss://nos.lol');

beforeAll(async () => {
  relay.connect();
});

afterAll(() => {
  relay.close();
});

test('connectivity', () => {
  return expect(
    new Promise(resolve => {
      relay.on('connect', () => {
        resolve(true);
      });
      relay.on('error', () => {
        resolve(false);
      });
    }),
  ).resolves.toBe(true);
});

test('querying', async () => {
  let resolve1;
  let resolve2;

  const sub = relay.sub([{ ids: ['d7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027'] }]);
  sub.on('event', event => {
    expect(event).toHaveProperty('id', 'd7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027');
    resolve1(true);
  });
  sub.on('eose', () => {
    resolve2(true);
  });

  const [t1, t2] = await Promise.all([
    new Promise(resolve => {
      resolve1 = resolve;
    }),
    new Promise(resolve => {
      resolve2 = resolve;
    }),
  ]);

  expect(t1).toEqual(true);
  expect(t2).toEqual(true);
});

test('get()', async () => {
  const event = await relay.get({ ids: ['d7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027'] });

  expect(event).toHaveProperty('id', 'd7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027');
});

test('list()', async () => {
  const events = await relay.list([
    { authors: ['3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d'], kinds: [1], limit: 2 },
  ]);

  expect(events.length).toEqual(2);
});

test('listening (twice) and publishing', async () => {
  const sk = generatePrivateKey();
  const pk = getPublicKey(sk);
  let resolve1: (value: unknown) => void;
  let resolve2: (value: unknown) => void;

  const sub = relay.sub([{ kinds: [27572], authors: [pk] }]);

  sub.on('event', event => {
    expect(event).toHaveProperty('pubkey', pk);
    expect(event).toHaveProperty('kind', 27572);
    expect(event).toHaveProperty('content', 'nostr-tools test suite');
    resolve1(true);
  });
  sub.on('event', event => {
    expect(event).toHaveProperty('pubkey', pk);
    expect(event).toHaveProperty('kind', 27572);
    expect(event).toHaveProperty('content', 'nostr-tools test suite');
    resolve2(true);
  });

  const event = {
    kind: 27572,
    pubkey: pk,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: 'nostr-tools test suite',
    id: '',
    sig: '',
  };
  event.id = getEventHash(event);
  event.sig = signEvent(event, sk);

  relay.publish(event);

  return expect(
    Promise.all([
      new Promise(resolve => {
        resolve1 = resolve;
      }),
      new Promise(resolve => {
        resolve2 = resolve;
      }),
    ]),
  ).resolves.toEqual([true, true]);
});
