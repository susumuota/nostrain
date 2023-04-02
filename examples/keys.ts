// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

// npx tsx examples/keys.ts

import { generatePrivateKey, getPublicKey } from '../dist/nostrain';

const sk = generatePrivateKey(); // `sk` is a hex string
const pk = getPublicKey(sk);     // `pk` is a hex string

console.log({ sk, pk });
