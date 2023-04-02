// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { schnorr } from '@noble/curves/secp256k1';
import { bytesToHex } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha256';

import { getPublicKey } from './keys';
import { utf8Encoder } from './utils';

enum Kind {
  Metadata = 0,
  Text = 1,
  RecommendRelay = 2,
  Contacts = 3,
  EncryptedDirectMessage = 4,
  EventDeletion = 5,
  Reaction = 7,
  ChannelCreation = 40,
  ChannelMetadata = 41,
  ChannelMessage = 42,
  ChannelHideMessage = 43,
  ChannelMuteUser = 44,
  Report = 1984,
  ZapRequest = 9734,
  Zap = 9735,
  RelayList = 10002,
  ClientAuth = 22242,
  Article = 30023,
}

type EventTemplate = {
  kind: Kind;
  tags: string[][];
  content: string;
  created_at: number;
};

type UnsignedEvent = EventTemplate & {
  pubkey: string;
};

type Event = UnsignedEvent & {
  id: string;
  sig: string;
};

const getBlankEvent = () =>
  // @ts-ignore // kind 255 is OK
  ({ kind: 255, content: '', tags: [], created_at: 0 } as EventTemplate);

const finishEvent = (event: EventTemplate, privateKey: string) => {
  const e = event as Event;
  e.pubkey = getPublicKey(privateKey);
  e.id = getEventHash(e);
  e.sig = signEvent(e, privateKey);
  return e;
};

const serializeEvent = (event: UnsignedEvent) => {
  if (!validateEvent(event)) throw new Error("can't serialize event with wrong or missing properties");
  return JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]);
};

const getEventHash = (event: UnsignedEvent) => bytesToHex(sha256(utf8Encoder.encode(serializeEvent(event))));

const validateEvent = (event: UnsignedEvent) => {
  if (typeof event !== 'object') return false;
  if (typeof event.kind !== 'number') return false;
  if (typeof event.content !== 'string') return false;
  if (typeof event.created_at !== 'number') return false;
  if (typeof event.pubkey !== 'string') return false;
  if (!event.pubkey.match(/^[a-f0-9]{64}$/)) return false;
  if (!Array.isArray(event.tags)) return false;
  for (const tag of event.tags) {
    if (!Array.isArray(tag)) return false;
    for (const t of tag) {
      if (typeof t === 'object') return false;
    }
  }
  return true;
};

const verifySignature = (event: Event) => schnorr.verify(event.sig, getEventHash(event), event.pubkey);

const signEvent = (event: UnsignedEvent, privateKey: string) =>
  bytesToHex(schnorr.sign(getEventHash(event), privateKey));

export type { EventTemplate, UnsignedEvent, Event };
export { Kind, getBlankEvent, finishEvent, serializeEvent, getEventHash, validateEvent, verifySignature, signEvent };
