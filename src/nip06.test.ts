// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { test, expect } from 'vitest';

import { nip06 } from '../dist/nostrain';

test('generate private key from a mnemonic', async () => {
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong';
  const privateKey = nip06.privateKeyFromSeedWords(mnemonic);
  expect(privateKey).toEqual(
    'c26cf31d8ba425b555ca27d00ca71b5008004f2f662470f8c8131822ec129fe2'
  );
});

test('generate private key from a mnemonic and passphrase', async () => {
  const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong';
  const passphrase = '123';
  const privateKey = nip06.privateKeyFromSeedWords(mnemonic, passphrase);
  expect(privateKey).toEqual(
    '55a22b8203273d0aaf24c22c8fbe99608e70c524b17265641074281c8b978ae4'
  );
});
