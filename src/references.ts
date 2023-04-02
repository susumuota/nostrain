// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import type { Event } from './event';
import type { AddressPointer, ProfilePointer, EventPointer } from './nip19';
import { decode } from './nip19';

type Reference = {
  text: string;
  profile?: ProfilePointer;
  event?: EventPointer;
  address?: AddressPointer;
};

const mentionRegex = /\bnostr:((note|npub|naddr|nevent|nprofile)1\w+)\b|#\[(\d+)\]/g;

const parseReferences = (evt: Event) => {
  const references: Reference[] = [];
  for (const ref of evt.content.matchAll(mentionRegex)) {
    if (ref[2] && ref[1]) {
      // it's a NIP-27 mention
      try {
        const { type, data } = decode(ref[1]);
        switch (type) {
          case 'npub': {
            references.push({ text: ref[0], profile: { pubkey: data as string, relays: [] } });
            break;
          }
          case 'nprofile': {
            references.push({ text: ref[0], profile: data as ProfilePointer });
            break;
          }
          case 'note': {
            references.push({ text: ref[0], event: { id: data as string, relays: [] } });
            break;
          }
          case 'nevent': {
            references.push({ text: ref[0], event: data as EventPointer });
            break;
          }
          case 'naddr': {
            references.push({ text: ref[0], address: data as AddressPointer });
            break;
          }
        }
      } catch (err: any) {
        throw err;
      }
    } else if (ref[3]) {
      // it's a NIP-10 mention
      const tag = evt.tags[parseInt(ref[3], 10)];
      if (!tag) continue;

      const relays = tag[2] ? [tag[2]] : [];
      switch (tag[0]) {
        case 'p': {
          references.push({ text: ref[0], profile: { pubkey: tag[1] ?? '', relays } });
          break;
        }
        case 'e': {
          references.push({ text: ref[0], event: { id: tag[1] ?? '', relays } });
          break;
        }
        case 'a': {
          try {
            if (!tag[1]) break; // TODO: or throw?
            const [kind, pubkey, identifier] = tag[1].split(':');
            if (!kind || !pubkey || !identifier) break; // TODO: or throw?
            references.push({ text: ref[0], address: { identifier, pubkey, kind: parseInt(kind, 10), relays } });
          } catch (err: any) {
            throw err;
          }
          break;
        }
      }
    }
  }

  return references;
};

export { parseReferences };
