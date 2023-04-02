// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils';
import { bech32 } from '@scure/base';

import { utf8Decoder, utf8Encoder } from './utils';

const BECH32_MAX_SIZE = 5000;

type ProfilePointer = {
  pubkey: string, // hex
  relays?: string[],
};

type EventPointer = {
  id: string, // hex
  relays?: string[],
  author?: string,
};

type AddressPointer = {
  identifier: string,
  pubkey: string,
  kind: number,
  relays?: string[],
};

type TLV = {
  [t: number]: Uint8Array[],
};

// TODO: refactor
const parseTLV = (data: Uint8Array) => {
  const result: TLV = {};
  let rest = data;
  while (rest.length > 0) {
    const t = rest[0];
    const l = rest[1];
    if (t === undefined || l === undefined) throw new Error('invalid TLV');
    const v = rest.slice(2, 2 + l);
    rest = rest.slice(2 + l);
    if (v.length < l) continue;
    result[t] = result[t] || [];
    result[t]?.push(v);
  }
  return result;
};

const nprofileDecode = (data: Uint8Array) => {
  const tlv = parseTLV(data);
  if (!tlv[0]?.[0]) throw new Error('missing TLV 0 for nprofile');
  if (tlv[0][0].length !== 32) throw new Error('TLV 0 should be 32 bytes');
  const pubkey = bytesToHex(tlv[0][0]);
  const relays = tlv[1] ? tlv[1].map(d => utf8Decoder.decode(d)) : [];
  return { type: 'nprofile', data: { pubkey, relays } as ProfilePointer };
};

const neventDecode = (data: Uint8Array) => {
  const tlv = parseTLV(data);
  if (!tlv[0]?.[0]) throw new Error('missing TLV 0 for nevent');
  if (tlv[0][0].length !== 32) throw new Error('TLV 0 should be 32 bytes');
  if (tlv[2] && tlv[2][0]?.length !== 32) throw new Error('TLV 2 should be 32 bytes');
  const id = bytesToHex(tlv[0][0]);
  const relays = tlv[1] ? tlv[1].map(d => utf8Decoder.decode(d)) : [];
  const author = tlv[2]?.[0] ? bytesToHex(tlv[2][0]) : undefined;
  return { type: 'nevent', data: { id, relays, author } as EventPointer };
};

const naddrDecode = (data: Uint8Array) => {
  const tlv = parseTLV(data);
  if (!tlv[0]?.[0]) throw new Error('missing TLV 0 for naddr');
  if (!tlv[2]?.[0]) throw new Error('missing TLV 2 for naddr');
  if (tlv[2][0].length !== 32) throw new Error('TLV 2 should be 32 bytes');
  if (!tlv[3]?.[0]) throw new Error('missing TLV 3 for naddr');
  if (tlv[3][0].length !== 4) throw new Error('TLV 3 should be 4 bytes');
  const identifier = utf8Decoder.decode(tlv[0][0]);
  const pubkey = bytesToHex(tlv[2][0]);
  const kind = parseInt(bytesToHex(tlv[3][0]), 16);
  const relays = tlv[1] ? tlv[1].map(d => utf8Decoder.decode(d)) : [];
  return { type: 'naddr', data: { identifier, pubkey, kind, relays } as AddressPointer };
};

const decode = (nip19: string): { type: string, data: ProfilePointer | EventPointer | AddressPointer | string } => {
  const { prefix, words } = bech32.decode(nip19, BECH32_MAX_SIZE);
  const data = bech32.fromWords(words);
  switch (prefix) {
    case 'nprofile': return nprofileDecode(data);
    case 'nevent': return neventDecode(data);
    case 'naddr': return naddrDecode(data);
    case 'nsec':
    case 'npub':
    case 'note':
      return { type: prefix, data: bytesToHex(data) };
    default:
      throw new Error(`unknown prefix ${prefix}`);
  }
};

const encodeTLV = (tlv: TLV) => {
  const entries: Uint8Array[] = [];
  Object.entries(tlv).forEach(([t, vs]) => {
    vs.forEach(v => {
      const entry = new Uint8Array(v.length + 2);
      entry.set([parseInt(t)], 0);
      entry.set([v.length], 1);
      entry.set(v, 2);
      entries.push(entry);
    });
  });
  return concatBytes(...entries);
};

const nprofileEncode = (profile: ProfilePointer) => {
  const data = encodeTLV({
    0: [hexToBytes(profile.pubkey)],
    1: (profile.relays || []).map(url => utf8Encoder.encode(url)),
  });
  return bech32.encode('nprofile', bech32.toWords(data), BECH32_MAX_SIZE);
};

const neventEncode = (event: EventPointer) => {
  const data = encodeTLV({
    0: [hexToBytes(event.id)],
    1: (event.relays || []).map(url => utf8Encoder.encode(url)),
    2: event.author ? [hexToBytes(event.author)] : [],
  });
  return bech32.encode('nevent', bech32.toWords(data), BECH32_MAX_SIZE);
};

const naddrEncode = (addr: AddressPointer) => {
  const kind = new ArrayBuffer(4);
  new DataView(kind).setUint32(0, addr.kind, false);
  const data = encodeTLV({
    0: [utf8Encoder.encode(addr.identifier)],
    1: (addr.relays || []).map(url => utf8Encoder.encode(url)),
    2: [hexToBytes(addr.pubkey)],
    3: [new Uint8Array(kind)],
  });
  return bech32.encode('naddr', bech32.toWords(data), BECH32_MAX_SIZE);
};

const encodeBytes = (prefix: string, hex: string) => (
  bech32.encode(prefix, bech32.toWords(hexToBytes(hex)), BECH32_MAX_SIZE)
);

const nsecEncode = (hex: string) => encodeBytes('nsec', hex);

const npubEncode = (hex: string) => encodeBytes('npub', hex);

const noteEncode = (hex: string) => encodeBytes('note', hex);

export type { ProfilePointer, EventPointer, AddressPointer };
export { decode, nprofileEncode, neventEncode, naddrEncode, nsecEncode, npubEncode, noteEncode };
