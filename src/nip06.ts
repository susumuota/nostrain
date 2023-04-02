// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { bytesToHex } from '@noble/hashes/utils';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { HDKey } from '@scure/bip32';
import { wordlist } from '@scure/bip39/wordlists/english.js';

const DERIVATION_PATH = "m/44'/1237'/0'/0/0";

const privateKeyFromSeedWords = (mnemonic: string, passphrase?: string) => {
  const masterKey = HDKey.fromMasterSeed(mnemonicToSeedSync(mnemonic, passphrase));
  const privateKey = masterKey.derive(DERIVATION_PATH).privateKey;
  if (!privateKey) throw new Error('could not derive private key');
  return bytesToHex(privateKey);
};

const generateSeedWords = () => generateMnemonic(wordlist, 256); // not 128!

const validateWords = (words: string) => validateMnemonic(words, wordlist);

export { privateKeyFromSeedWords, generateSeedWords, validateWords };
