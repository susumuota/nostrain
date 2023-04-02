// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { schnorr } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

import type { Event } from './event';
import { utf8Encoder } from './utils';
import { getPublicKey } from './keys';

type Parameters = {
  pubkey: string; // the key to whom the delegation will be given
  kind?: number;
  until?: number; // delegation will only be valid until this date
  since?: number; // delegation will be valid from this date on
};

type Delegation = {
  from: string; // the pubkey who signed the delegation
  to: string; // the pubkey that is allowed to use the delegation
  cond: string; // the string of conditions as they should be included in the event tag
  sig: string;
};

const createDelegation = (privateKey: string, parameters: Parameters) => {
  let conditions = [];
  if ((parameters.kind || -1) >= 0) conditions.push(`kind=${parameters.kind}`);
  if (parameters.until) conditions.push(`created_at<${parameters.until}`);
  if (parameters.since) conditions.push(`created_at>${parameters.since}`);
  const cond = conditions.join('&');

  if (cond === '') throw new Error('refusing to create a delegation without any conditions');

  const sighash = sha256(utf8Encoder.encode(`nostr:delegation:${parameters.pubkey}:${cond}`));

  const sig = bytesToHex(schnorr.sign(sighash, privateKey));

  return { from: getPublicKey(privateKey), to: parameters.pubkey, cond, sig } as Delegation;
};

const getDelegator = (event: Event) => {
  // find delegation tag
  const tag = event.tags.find(tag => tag[0] === 'delegation' && tag.length >= 4);
  if (!tag) return null;

  const [_, pubkey, cond, sig] = tag;
  if (!pubkey || !cond || !sig) return null;

  // check conditions
  const conditions = cond.split('&');
  for (const c of conditions) {
    const [key, operator, value] = c.split(/\b/);
    if (!key || !operator || !value) return null;
    const v = parseInt(value);

    // the supported conditions are just 'kind' and 'created_at' for now
    if (key === 'kind' && operator === '=' && event.kind === v) {
      continue;
    } else if (key === 'created_at' && operator === '<' && event.created_at < v) {
      continue;
    } else if (key === 'created_at' && operator === '>' && event.created_at > v) {
      continue;
    } else {
      return null; // invalid condition
    }
  }

  // check signature
  const sighash = sha256(utf8Encoder.encode(`nostr:delegation:${event.pubkey}:${cond}`));
  if (!schnorr.verify(sig, sighash, pubkey)) return null;

  return pubkey;
};

export type { Parameters, Delegation };
export { createDelegation, getDelegator };
