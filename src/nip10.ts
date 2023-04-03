// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import type { Event } from './event';
import type { EventPointer, ProfilePointer } from './nip19';

type NIP10Result = {
  // Pointer to the root of the thread.
  root: EventPointer | undefined;
  // Pointer to a "parent" event that parsed event replies to (responded to).
  reply: EventPointer | undefined;
  // Pointers to events which may or may not be in the reply chain.
  mentions: EventPointer[];
  // List of pubkeys that are involved in the thread in no particular order.
  profiles: ProfilePointer[];
};

const parsePTag = (tag: string[]) => {
  return { pubkey: tag[1], relays: tag[2] ? [tag[2]] : [] } as ProfilePointer;
};

const parseETag = (tag: string[]) => {
  const [_, id, relay, marker] = tag as [string, string, undefined | string, undefined | string];
  return { marker, eventPointer: { id, relays: relay ? [relay] : [] } as EventPointer };
};

const parse = (event: Pick<Event, 'tags'>) => {
  const result = {
    root: undefined,
    reply: undefined,
    mentions: [],
    profiles: [],
  } as NIP10Result;

  // parse p tags
  result.profiles = event.tags.filter(tag => tag[0] === 'p' && tag[1]).map(parsePTag);

  // parse e tags
  const eTags = event.tags.filter(tag => tag[0] === 'e' && tag[1]).map(parseETag);

  // set root, reply, and mentions
  eTags.forEach(({ marker, eventPointer }, index) => {
    switch (marker) {
      case 'root':
        result.root = eventPointer;
        break;
      case 'reply':
        result.reply = eventPointer;
        break;
      case 'mention':
        result.mentions.push(eventPointer);
        break;
      default: // unknown marker or no marker
        if (index === 0) {
          result.root = eventPointer;
        } else if (index === eTags.length - 1) {
          result.reply = eventPointer;
        } else {
          result.mentions.push(eventPointer);
        }
    }
  });

  return result;
};

export type { NIP10Result };
export { parse };
