// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { test, expect } from 'vitest';

import fetch from 'node-fetch';
import { nip05 } from '../dist/nostrain';

test('fetch nip05 profiles', async () => {
  nip05.useFetchImplementation(fetch);

  const p1 = await nip05.queryProfile('jb55.com');
  // @ts-ignore
  expect(p1.pubkey).toEqual('32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245');
  // @ts-ignore
  expect(p1.relays).toEqual(['wss://relay.damus.io']);

  const p2 = await nip05.queryProfile('jb55@jb55.com');
  // @ts-ignore
  expect(p2.pubkey).toEqual('32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245');
  // @ts-ignore
  expect(p2.relays).toEqual(['wss://relay.damus.io']);
});
