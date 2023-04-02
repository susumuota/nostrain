// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

// node examples/keys.js

import { generatePrivateKey, getPublicKey } from 'nostrain';

const sk = generatePrivateKey(); // `sk` is a hex string
const pk = getPublicKey(sk); // `pk` is a hex string

console.log({ sk, pk });
