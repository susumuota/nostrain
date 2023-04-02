// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import type { Event } from './event';

type Filter = {
  ids?: string[],
  kinds?: number[],
  authors?: string[],
  since?: number,
  until?: number,
  limit?: number,
  search?: string,
  [key: `#${string}`]: string[],  // e.g. '#e', '#p'
};

const matchFilter = (filter: Filter, event: Event): boolean => {
  if (filter.ids && filter.ids.indexOf(event.id) === -1) return false;
  if (filter.kinds && filter.kinds.indexOf(event.kind) === -1) return false;
  if (filter.authors && filter.authors.indexOf(event.pubkey) === -1) return false;

  for (const f in filter) {
    if (f[0] === '#') {
      const tagName = f.slice(1);
      const values = filter[`#${tagName}`];
      if (values && !event.tags.find(([t, v]) => t === f.slice(1) && v && values.indexOf(v) !== -1)) return false;
    }
  }

  if (filter.since && event.created_at < filter.since) return false;
  if (filter.until && event.created_at >= filter.until) return false;

  return true;
};

const matchFilters = (filters: Filter[], event: Event) => (
  filters.find(filter => matchFilter(filter, event)) !== undefined
);

export type { Filter };
export { matchFilter, matchFilters };
