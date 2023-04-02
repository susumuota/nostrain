// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { nip05 } from 'nostrain';

const profile = await nip05.queryProfile('jb55.com');

console.log({ profile });
