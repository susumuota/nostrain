// SPDX-FileCopyrightText: 2023 Susumu OTA <1632335+susumuota@users.noreply.github.com>
// SPDX-License-Identifier: MIT

import { expect, describe, it } from 'vitest';

import { matchFilter, matchFilters } from '../dist/nostrain';

describe('Filter', () => {
  describe('matchFilter', () => {
    it('should return true when all filter conditions are met', () => {
      const filter = {
        ids: ['123', '456'],
        kinds: [1, 2, 3],
        authors: ['abc'],
        since: 100,
        until: 200,
        '#tag': ['value'],
      };

      const event = {
        id: '123',
        kind: 1,
        pubkey: 'abc',
        created_at: 150,
        tags: [['tag', 'value']],
      };

      // @ts-ignore
      const result = matchFilter(filter, event);

      expect(result).toEqual(true);
    });

    it('should return false when the event id is not in the filter', () => {
      const filter = { ids: ['123', '456'] };

      const event = { id: '789' };

      // @ts-ignore
      const result = matchFilter(filter, event);

      expect(result).toEqual(false);
    });

    it('should return false when the event kind is not in the filter', () => {
      const filter = { kinds: [1, 2, 3] };

      const event = { kind: 4 };

      // @ts-ignore
      const result = matchFilter(filter, event);

      expect(result).toEqual(false);
    });

    it('should return false when the event author is not in the filter', () => {
      const filter = { authors: ['abc', 'def'] };

      const event = { pubkey: 'ghi' };

      // @ts-ignore
      const result = matchFilter(filter, event);

      expect(result).toEqual(false);
    });

    it('should return false when a tag is not present in the event', () => {
      const filter = { '#tag': ['value1', 'value2'] };

      const event = { tags: [['not_tag', 'value1']] };

      // @ts-ignore
      const result = matchFilter(filter, event);

      expect(result).toEqual(false);
    });

    it('should return false when a tag value is not present in the event', () => {
      const filter = { '#tag': ['value1', 'value2'] };

      const event = { tags: [['tag', 'value3']] };

      // @ts-ignore
      const result = matchFilter(filter, event);

      expect(result).toEqual(false);
    });

    it('should return true when filter has tags that is present in the event', () => {
      const filter = { '#tag1': ['foo'] };

      const event = {
        id: '123',
        kind: 1,
        pubkey: 'abc',
        created_at: 150,
        tags: [
          ['tag1', 'foo'],
          ['tag2', 'bar'],
        ],
      };

      // @ts-ignore
      const result = matchFilter(filter, event);

      expect(result).toEqual(true);
    });

    it('should return false when the event is before the filter since value', () => {
      const filter = { since: 100 };

      const event = { created_at: 50 };

      // @ts-ignore
      const result = matchFilter(filter, event);

      expect(result).toEqual(false);
    });

    it('should return false when the event is after the filter until value', () => {
      const filter = { until: 100 };

      const event = { created_at: 150 };

      // @ts-ignore
      const result = matchFilter(filter, event);

      expect(result).toEqual(false);
    });
  });

  describe('matchFilters', () => {
    it('should return true when at least one filter matches the event', () => {
      const filters = [
        { ids: ['123'], kinds: [1], authors: ['abc'] },
        { ids: ['456'], kinds: [2], authors: ['def'] },
        { ids: ['789'], kinds: [3], authors: ['ghi'] },
      ];

      const event = { id: '789', kind: 3, pubkey: 'ghi' };

      // @ts-ignore
      const result = matchFilters(filters, event);

      expect(result).toEqual(true);
    });

    it('should return true when event matches one or more filters and some have limit set', () => {
      const filters = [
        { ids: ['123'], limit: 1 },
        { kinds: [1], limit: 2 },
        { authors: ['abc'], limit: 3 },
      ];

      const event = { id: '123', kind: 1, pubkey: 'abc', created_at: 150 };

      // @ts-ignore
      const result = matchFilters(filters, event);

      expect(result).toEqual(true);
    });

    it('should return false when no filters match the event', () => {
      const filters = [
        { ids: ['123'], kinds: [1], authors: ['abc'] },
        { ids: ['456'], kinds: [2], authors: ['def'] },
        { ids: ['789'], kinds: [3], authors: ['ghi'] },
      ];

      const event = { id: '100', kind: 4, pubkey: 'jkl' };

      // @ts-ignore
      const result = matchFilters(filters, event);

      expect(result).toEqual(false);
    });

    it('should return false when event matches none of the filters and some have limit set', () => {
      const filters = [
        { ids: ['123'], limit: 1 },
        { kinds: [1], limit: 2 },
        { authors: ['abc'], limit: 3 },
      ];
      const event = { id: '456', kind: 2, pubkey: 'def', created_at: 200 };

      // @ts-ignore
      const result = matchFilters(filters, event);

      expect(result).toEqual(false);
    });
  });
});
