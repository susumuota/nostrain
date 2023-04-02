// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

// npx tsx examples/event.ts

import {
  validateEvent,
  verifySignature,
  signEvent,
  getEventHash,
  generatePrivateKey,
  getPublicKey
} from '../dist/nostrain';
import type { Event } from '../dist/index';

const privateKey = generatePrivateKey();

const event = {
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [],
  content: 'hello',
  pubkey: getPublicKey(privateKey),
  id: '',
  sig: '',
} as Event;

event.id = getEventHash(event);
event.sig = signEvent(event, privateKey);
const validateOk = validateEvent(event);
const verifyOk = verifySignature(event);

console.log({ event, validateOk, verifyOk });
