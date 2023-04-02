# nostrain: Nostr client library with no strain

A nostr client library with modern style and refactoring.

Most of the functions are compatible with nostr-tools.

Only depends on @noble and @scure packages.

## Installation

```bash
npm install nostrain
```

## Usage

### Generating a private key and a public key

```typescript
import { generatePrivateKey, getPublicKey } from '../dist/nostrain';

const sk = generatePrivateKey(); // `sk` is a hex string
const pk = getPublicKey(sk);     // `pk` is a hex string

console.log({ sk, pk });
```

### Creating, signing and verifying events

```typescript
import {
  validateEvent,
  verifySignature,
  signEvent,
  getEventHash,
  generatePrivateKey,
  getPublicKey
} from '../dist/nostrain';
import type { Event } from '../dist/index';

const privateKey = generatePrivateKey();

const event = {
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [],
  content: 'hello',
  pubkey: getPublicKey(privateKey),
  id: '',
  sig: '',
} as Event;

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

See [https://github.com/susumuota/src/references.test.js](src/references.test.js).

### Querying profile data from a NIP-05 address

```typescript
import { nip05 } from '../dist/nostrain';

const profile = await nip05.queryProfile('jb55.com');

console.log({ profile });
```

### Encoding and decoding NIP-19 codes

```typescript
import { nip19, generatePrivateKey, getPublicKey } from '../dist/nostrain';
import type { ProfilePointer } from '../dist/nip19';

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
  const nprofile = nip19.nprofileEncode({ pubkey: pk, relays } as ProfilePointer);
  const { type, data } = nip19.decode(nprofile);
  console.log({ pk, relays, nprofile, type, data });
}
```

### Encrypting and decrypting direct messages

```typescript
import crypto from 'node:crypto';

// @ts-ignore
globalThis.crypto = crypto;

import { nip04, getPublicKey, generatePrivateKey } from '../dist/nostrain';

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

```typescript
import { nip26, getPublicKey, generatePrivateKey } from '../dist/nostrain';

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
```

## Development

```bash
git clone https://github.com/susumuota/nostrain.git
cd nostrain
npm ci
npm run build  # or npm run watch
npm run test
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

- nostr: [`npub1susumuq8u7v0sp2f5jl3wjuh8hpc3cqe2tc2j5h4gu7ze7z20asq2w0yu8`](https://iris.to/s_ota)
- GitHub: [susumuota](https://github.com/susumuota)
- Twitter: [@susumuota](https://twitter.com/susumuota)
