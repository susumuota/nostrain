// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import type { ProfilePointer } from './nip19';

let _fetch: any

try {
  _fetch = fetch
} catch {}

const useFetchImplementation = (fetchImplementation: any) => {
  _fetch = fetchImplementation;
};

const searchDomain = async (domain: string, query = '') => {
  try {
    const response = await _fetch(`https://${domain}/.well-known/nostr.json?name=${query}`);
    const json = await response.json();
    return json.names as { [name: string]: string };
  } catch (err: any) {
    return {};
  }
};

const queryProfile = async (fullname: string) => {
  let [name, domain] = fullname.split('@');

  if (!domain) {
    // if there is no @, it is because it is just a domain, so assume the name is "_"
    domain = name;
    name = '_';
  }

  if (!name || !name.match(/^[A-Za-z0-9-_]+$/)) return null;
  if (!domain || !domain.includes('.')) return null;

  let json: any;
  try {
    const response = await _fetch(`https://${domain}/.well-known/nostr.json?name=${name}`);
    json = await response.json();
  } catch (err: any) {
    return null;
  }

  if (!json?.names?.[name]) return null;

  const pubkey = json.names[name] as string;
  const relays = (json.relays?.[pubkey] || []) as string[]; // nip35

  return { pubkey, relays } as ProfilePointer;
};

export { useFetchImplementation, searchDomain, queryProfile };
