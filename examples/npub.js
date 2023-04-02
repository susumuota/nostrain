// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { nip19, generatePrivateKey, getPublicKey } from 'nostrain';

{
  const sk = generatePrivateKey();
  const nsec = nip19.nsecEncode(sk);
  const { type, data } = nip19.decode(nsec);

  console.log({ sk, nsec, type, data });
}

{
  const pk = getPublicKey(generatePrivateKey());
  const npub = nip19.npubEncode(pk);
  const { type, data } = nip19.decode(npub);
  console.log({ pk, npub, type, data });
}

{
  const pk = getPublicKey(generatePrivateKey());
  const relays = [
    'wss://relay.nostr.example.mydomain.example.com',
    'wss://nostr.banana.com',
  ];
  const nprofile = nip19.nprofileEncode({ pubkey: pk, relays });
  const { type, data } = nip19.decode(nprofile);
  console.log({ pk, relays, nprofile, type, data });
}
