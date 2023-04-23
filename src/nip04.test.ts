// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { test, expect } from 'vitest';

import { nip04, getPublicKey, generatePrivateKey } from '../dist/nostrain';

test('encrypt and decrypt message', async () => {
  const sk1 = generatePrivateKey();
  const sk2 = generatePrivateKey();
  const pk1 = getPublicKey(sk1);
  const pk2 = getPublicKey(sk2);

  expect(await nip04.decrypt(sk2, pk1, await nip04.encrypt(sk1, pk2, 'hello'))).toEqual('hello');
});
