# nostrain: Nostr client library with no strain

[![npm](https://img.shields.io/npm/v/nostrain?color=blue)](https://www.npmjs.com/package/nostrain)
[![npm bundle size](https://img.shields.io/bundlephobia/min/nostrain)](https://github.com/susumuota/nostrain)
[![GitHub](https://img.shields.io/github/license/susumuota/nostrain)](https://github.com/susumuota/nostrain/blob/main/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/susumuota/nostrain/build.yaml)](https://github.com/susumuota/nostrain/actions/workflows/build.yaml)
[![GitHub last commit](https://img.shields.io/github/last-commit/susumuota/nostrain)](https://github.com/susumuota/nostrain/commits)
&emsp;
EN |
[JA](https://github-com.translate.goog/susumuota/nostrain/blob/main/README.md?_x_tr_sl=en&_x_tr_tl=ja&_x_tr_hl=ja&_x_tr_pto=wapp) |
[ES](https://github-com.translate.goog/susumuota/nostrain/blob/main/README.md?_x_tr_sl=en&_x_tr_tl=es&_x_tr_hl=es&_x_tr_pto=wapp) |
[ZH](https://github-com.translate.goog/susumuota/nostrain/blob/main/README.md?_x_tr_sl=en&_x_tr_tl=zh-CN&_x_tr_hl=zh-CN&_x_tr_pto=wapp)

- A Nostr client library with modern TypeScript style.
- Most of the functions are refactored from [nostr-tools](https://github.com/nbd-wtf/nostr-tools) and are compatible with it.
- Only depends on [@noble](https://github.com/paulmillr/noble-curves) and [@scure](https://github.com/paulmillr/scure-base) packages.

## Installation

```bash
npm install nostrain
```

## Usage

- See [examples](https://github.com/susumuota/nostrain/tree/main/examples).

### Generating a private key and a public key

```javascript
import { generatePrivateKey, getPublicKey } from 'nostrain';

const sk = generatePrivateKey(); // `sk` is a hex string
const pk = getPublicKey(sk); // `pk` is a hex string

console.log({ sk, pk });
```

### Creating, signing and verifying events

```javascript
import { validateEvent, verifySignature, signEvent, getEventHash, generatePrivateKey, getPublicKey } from 'nostrain';

const privateKey = generatePrivateKey();

const event = {
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [],
  content: 'hello',
  pubkey: getPublicKey(privateKey),
  id: '',
  sig: '',
};

event.id = getEventHash(event);
event.sig = signEvent(event, privateKey);
const validateOk = validateEvent(event);
const verifyOk = verifySignature(event);

console.log({ event, validateOk, verifyOk });
```

### Interacting with a relay

TODO: work in progress

### Interacting with multiple relays

TODO: work in progress

### Parsing references (mentions) from a content using NIP-10 and NIP-27

See [src/references.test.ts](https://github.com/susumuota/nostrain/blob/main/src/references.test.ts).

### Querying profile data from a NIP-05 address

```javascript
import { nip05 } from 'nostrain';

const profile = await nip05.queryProfile('jb55.com');

console.log({ profile });
```

### Encoding and decoding NIP-19 codes

```javascript
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
  const relays = ['wss://relay.nostr.example.mydomain.example.com', 'wss://nostr.banana.com'];
  const nprofile = nip19.nprofileEncode({ pubkey: pk, relays });
  const { type, data } = nip19.decode(nprofile);
  console.log({ pk, relays, nprofile, type, data });
}
```

### Encrypting and decrypting direct messages

```javascript
import crypto from 'node:crypto';

globalThis.crypto = crypto;

import { nip04, getPublicKey, generatePrivateKey } from 'nostrain';

// sender
const sk1 = generatePrivateKey();
const pk1 = getPublicKey(sk1);

// receiver
const sk2 = generatePrivateKey();
const pk2 = getPublicKey(sk2);

// on the sender side
const message = 'hello';
const ciphertext = await nip04.encrypt(sk1, pk2, message);

// on the receiver side
const plaintext = await nip04.decrypt(sk2, pk1, ciphertext);

console.log({ message, ciphertext, plaintext });
```

### Performing and checking for delegation

```javascript
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
  tags: [['delegation', delegation.from, delegation.cond, delegation.sig]],
};

console.log({ tags: event.tags });

// finally any receiver of this event can check for the presence of a valid delegation tag
const delegator = nip26.getDelegator(event);

console.log({ delegator, pk1, success: delegator === pk1 }); // will be null if there is no delegation tag or if it is invalid
```

## Development

```bash
git clone https://github.com/susumuota/nostrain.git
cd nostrain
npm ci
npm run build  # or npm run watch
npm run test
npm run format
```

## Source code

- https://github.com/susumuota/nostrain

## Related Links

- [Nostr](https://github.com/nostr-protocol/nostr): The simplest open protocol that is able to create a censorship-resistant global "social" network once and for all.
- [NIPs](https://github.com/nostr-protocol/nips): NIPs stand for Nostr Implementation Possibilities. They exist to document what may be implemented by Nostr-compatible relay and client software.
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools): Tools for developing Nostr clients.
- [noble-curves](https://github.com/paulmillr/noble-curves): Audited & minimal JavaScript implementation of elliptic curve cryptography.
- [scure-base](https://github.com/paulmillr/scure-base): Secure, audited and 0-dep implementation of bech32, etc.

## License

MIT License, see [LICENSE](LICENSE) file.

## Author

S. Ota

- nostr: [npub1susumuq8u7v0sp2f5jl3wjuh8hpc3cqe2tc2j5h4gu7ze7z20asq2w0yu8](https://iris.to/s_ota)
- GitHub: [susumuota](https://github.com/susumuota)
- Twitter: [@susumuota](https://twitter.com/susumuota)
