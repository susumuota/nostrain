// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

// node examples/delegation.js

import { nip26, getPublicKey, generatePrivateKey } from 'nostrain';

// delegator
const sk1 = generatePrivateKey();
const pk1 = getPublicKey(sk1);

// delegatee
const sk2 = generatePrivateKey();
const pk2 = getPublicKey(sk2);

// generate delegation
const delegation = nip26.createDelegation(sk1, {
  pubkey: pk2,
  kind: 1,
  since: Math.round(Date.now() / 1000) - 1, // 1 second ago
  until: Math.round(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
});

console.log({ delegation });

// the delegatee uses the delegation when building an event
const event = {
  pubkey: pk2,
  kind: 1,
  created_at: Math.round(Date.now() / 1000),
  content: 'hello from a delegated key',
  tags: [['delegation', delegation.from, delegation.cond, delegation.sig]]
};

console.log({ tags: event.tags });

// finally any receiver of this event can check for the presence of a valid delegation tag
const delegator = nip26.getDelegator(event);

console.log({ delegator, pk1, success: delegator === pk1 }); // will be null if there is no delegation tag or if it is invalid
