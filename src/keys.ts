// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { schnorr } from '@noble/curves/secp256k1';
import { bytesToHex } from '@noble/hashes/utils';

const generatePrivateKey = () => bytesToHex(schnorr.utils.randomPrivateKey());

const getPublicKey = (privateKey: string) => bytesToHex(schnorr.getPublicKey(privateKey));

export { generatePrivateKey, getPublicKey };
