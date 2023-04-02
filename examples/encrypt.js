// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import crypto from 'node:crypto';

// @ts-ignore
globalThis.crypto = crypto;

import { nip04, getPublicKey, generatePrivateKey } from 'nostrain';

// sender
const sk1 = generatePrivateKey();
const pk1 = getPublicKey(sk1);

// receiver
const sk2 = generatePrivateKey();
const pk2 = getPublicKey(sk2);

// on the sender side
const message = 'hello';
const ciphertext = await nip04.encrypt(sk1, pk2, message);

// on the receiver side
const plaintext = await nip04.decrypt(sk2, pk1, ciphertext);

console.log({ message, ciphertext, plaintext });
