// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

let _fetch: any;

try {
  _fetch = fetch;
} catch {}

const useFetchImplementation = (fetchImplementation: any) => {
  _fetch = fetchImplementation;
};

const validateGithub = async (pubkey: string, username: string, proof: string) => {
  try {
    const response = await _fetch(`https://gist.github.com/${username}/${proof}/raw`);
    const text = await response.text();
    return text === `Verifying that I control the following Nostr public key: ${pubkey}`;
  } catch (err: any) {
    return false;
  }
};

export { useFetchImplementation, validateGithub };
