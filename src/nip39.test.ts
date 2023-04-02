// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { test, expect } from 'vitest';

import fetch from 'node-fetch';
import { nip39 } from '../dist/nostrain';

test('validate github claim', async () => {
  nip39.useFetchImplementation(fetch);

  const result = await nip39.validateGithub(
    'npub1gcxzte5zlkncx26j68ez60fzkvtkm9e0vrwdcvsjakxf9mu9qewqlfnj5z', // cspell:disable-line
    'vitorpamplona', // cspell:disable-line
    'cf19e2d1d7f8dac6348ad37b35ec8421'
  );
  expect(result).toBe(true);
});
