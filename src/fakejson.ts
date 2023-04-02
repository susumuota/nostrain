// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

// this is a tiny json parser to avoid to run JSON.parse() on the whole json string

const getHex64 = (json: string, field: string) => {
  const len = field.length + 3;
  const idx = json.indexOf(`"${field}":`) + len;
  const s = json.slice(idx).indexOf(`"`) + idx + 1;
  return json.slice(s, s + 64);
};

const getInt = (json: string, field: string) => {
  const len = field.length;
  const idx = json.indexOf(`"${field}":`) + len + 3;
  const sliced = json.slice(idx);
  const end = Math.min(sliced.indexOf(','), sliced.indexOf('}'));
  return parseInt(sliced.slice(0, end), 10);
};

const getSubscriptionId = (json: string) => {
  const idx = json.slice(0, 22).indexOf(`"EVENT"`);
  if (idx === -1) return null;

  const pstart = json.slice(idx + 7 + 1).indexOf(`"`);
  if (pstart === -1) return null;
  const start = idx + 7 + 1 + pstart;

  const pend = json.slice(start + 1, 80).indexOf(`"`);
  if (pend === -1) return null;
  const end = start + 1 + pend;

  return json.slice(start + 1, end);
};

const matchEventId = (json: string, id: string) => id === getHex64(json, 'id');

const matchEventPubkey = (json: string, pubkey: string) => pubkey === getHex64(json, 'pubkey');

const matchEventKind = (json: string, kind: number) => kind === getInt(json, 'kind');

export { getHex64, getInt, getSubscriptionId, matchEventId, matchEventPubkey, matchEventKind };
