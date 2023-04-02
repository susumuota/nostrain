// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { secp256k1 } from '@noble/curves/secp256k1';
import { randomBytes } from '@noble/hashes/utils';
import { base64 } from '@scure/base';

import { utf8Decoder, utf8Encoder } from './utils';

const getNormalizedX = (key: Uint8Array) => key.slice(1, 33);

const encrypt = async (privkey: string, pubkey: string, text: string) => {
  const key = secp256k1.getSharedSecret(privkey, '02' + pubkey);
  const normalizedKey = getNormalizedX(key);
  const iv = Uint8Array.from(randomBytes(16));
  const plainText = utf8Encoder.encode(text);
  const cryptoKey = await crypto.subtle.importKey('raw', normalizedKey, { name: 'AES-CBC' }, false, ['encrypt']);
  const cipherText = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, plainText);
  const ctb64 = base64.encode(new Uint8Array(cipherText));
  const ivb64 = base64.encode(new Uint8Array(iv.buffer));
  return `${ctb64}?iv=${ivb64}`;
};

const decrypt = async (privkey: string, pubkey: string, data: string) => {
  const [ctb64, ivb64] = data.split('?iv=');
  if (!ctb64 || !ivb64) throw new Error('invalid data');
  const key = secp256k1.getSharedSecret(privkey, '02' + pubkey);
  const normalizedKey = getNormalizedX(key);
  const cryptoKey = await crypto.subtle.importKey('raw', normalizedKey, { name: 'AES-CBC' }, false, ['decrypt']);
  const cipherText = base64.decode(ctb64);
  const iv = base64.decode(ivb64);
  const plainText = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, cipherText);
  return utf8Decoder.decode(plainText);
};

export { encrypt, decrypt };
