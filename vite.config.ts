import path from 'node:path';
import { defineConfig } from 'vite';

// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'Nostrain',
    },
    rollupOptions: {
      external: [
        "@noble/curves/secp256k1",
        "@noble/hashes/sha256",
        "@noble/hashes/utils",
        "@scure/base",
        "@scure/bip32",
        "@scure/bip39",
        "@scure/bip39/wordlists/english.js",
      ],
      output: {
        globals: {
          "@noble/curves/secp256k1": "NobleSecp256k1",
          "@noble/hashes/sha256": "NobleSha256",
          "@noble/hashes/utils": "NobleUtils",
          "@scure/base": "ScureBase",
          "@scure/bip32": "ScureBip32",
          "@scure/bip39": "ScureBip39",
          "@scure/bip39/wordlists/english.js": "ScureBip39English",
        },
      },
    },
  },
});
