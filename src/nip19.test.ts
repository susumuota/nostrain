// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { test, expect } from 'vitest';

import { nip19, generatePrivateKey, getPublicKey } from '../dist/nostrain';

test('encode and decode nsec', () => {
  const sk = generatePrivateKey();
  const nsec = nip19.nsecEncode(sk);
  expect(nsec).toMatch(/nsec1\w+/);
  const { type, data } = nip19.decode(nsec);
  expect(type).toEqual('nsec');
  expect(data).toEqual(sk);
});

test('encode and decode npub', () => {
  const pk = getPublicKey(generatePrivateKey());
  const npub = nip19.npubEncode(pk);
  expect(npub).toMatch(/npub1\w+/);
  const { type, data } = nip19.decode(npub);
  expect(type).toEqual('npub');
  expect(data).toEqual(pk);
});

test('encode and decode nprofile', () => {
  const pk = getPublicKey(generatePrivateKey());
  const relays = ['wss://relay.nostr.example.mydomain.example.com', 'wss://nostr.banana.com'];
  const nprofile = nip19.nprofileEncode({ pubkey: pk, relays });
  expect(nprofile).toMatch(/nprofile1\w+/);
  const { type, data } = nip19.decode(nprofile);
  expect(type).toEqual('nprofile'); // @ts-ignore
  expect(data.pubkey).toEqual(pk); // @ts-ignore
  expect(data.relays).toContain(relays[0]); // @ts-ignore
  expect(data.relays).toContain(relays[1]);
});

test('decode nprofile without relays', () => {
  expect(
    nip19.decode(
      nip19.nprofileEncode({
        pubkey: '97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322',
        relays: [],
      }),
    ).data,
  ).toHaveProperty('pubkey', '97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322');
});

test('encode and decode naddr', () => {
  const pk = getPublicKey(generatePrivateKey());
  const relays = ['wss://relay.nostr.example.mydomain.example.com', 'wss://nostr.banana.com'];
  const naddr = nip19.naddrEncode({
    pubkey: pk,
    relays,
    kind: 30023,
    identifier: 'banana',
  });
  expect(naddr).toMatch(/naddr1\w+/);
  const { type, data } = nip19.decode(naddr);
  expect(type).toEqual('naddr'); // @ts-ignore
  expect(data.pubkey).toEqual(pk); // @ts-ignore
  expect(data.relays).toContain(relays[0]); // @ts-ignore
  expect(data.relays).toContain(relays[1]); // @ts-ignore
  expect(data.kind).toEqual(30023); // @ts-ignore
  expect(data.identifier).toEqual('banana');
});

test('decode naddr from habla.news', () => {
  const { type, data } = nip19.decode(
    'naddr1qq98yetxv4ex2mnrv4esygrl54h466tz4v0re4pyuavvxqptsejl0vxcmnhfl60z3rth2xkpjspsgqqqw4rsf34vl5',
  );
  expect(type).toEqual('naddr'); // @ts-ignore
  expect(data.pubkey).toEqual('7fa56f5d6962ab1e3cd424e758c3002b8665f7b0d8dcee9fe9e288d7751ac194'); // @ts-ignore
  expect(data.kind).toEqual(30023); // @ts-ignore
  expect(data.identifier).toEqual('references');
});

test('decode naddr from go-nostr with different TLV ordering', () => {
  const { type, data } = nip19.decode(
    'naddr1qqrxyctwv9hxzq3q80cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsxpqqqp65wqfwwaehxw309aex2mrp0yhxummnw3ezuetcv9khqmr99ekhjer0d4skjm3wv4uxzmtsd3jjucm0d5q3vamnwvaz7tmwdaehgu3wvfskuctwvyhxxmmd0zfmwx',
  );

  expect(type).toEqual('naddr'); // @ts-ignore
  expect(data.pubkey).toEqual('3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d'); // @ts-ignore
  expect(data.relays).toContain('wss://relay.nostr.example.mydomain.example.com'); // @ts-ignore
  expect(data.relays).toContain('wss://nostr.banana.com'); // @ts-ignore
  expect(data.kind).toEqual(30023); // @ts-ignore
  expect(data.identifier).toEqual('banana');
});
