// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { test, expect } from 'vitest';

import  { generatePrivateKey, getPublicKey } from '../dist/nostrain';

test('test private key generation', () => {
  expect(generatePrivateKey()).toMatch(/[a-f0-9]{64}/);
});

test('test public key generation', () => {
  expect(getPublicKey(generatePrivateKey())).toMatch(/[a-f0-9]{64}/);
});

test('test public key from private key deterministic', () => {
  const sk = generatePrivateKey();
  const pk = getPublicKey(sk);

  for (const _ of Array(5)) {
    expect(getPublicKey(sk)).toEqual(pk);
  }
});
