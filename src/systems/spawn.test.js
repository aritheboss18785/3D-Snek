import { describe, it, expect } from 'vitest';
import { getTargetCount, getStartingTier } from './spawn.js';

describe('getTargetCount', () => {
  it('returns 3 for length 1',    () => expect(getTargetCount(1)).toBe(3));
  it('returns 3 for length 20',   () => expect(getTargetCount(20)).toBe(3));
  it('returns 5 for length 21',   () => expect(getTargetCount(21)).toBe(5));
  it('returns 5 for length 50',   () => expect(getTargetCount(50)).toBe(5));
  it('returns 8 for length 51',   () => expect(getTargetCount(51)).toBe(8));
  it('returns 8 for length 100',  () => expect(getTargetCount(100)).toBe(8));
  it('returns 10 for length 101', () => expect(getTargetCount(101)).toBe(10));
  it('returns 10 for length 999', () => expect(getTargetCount(999)).toBe(10));
});

describe('getStartingTier', () => {
  it('returns 0 (BASIC) for length 10',        () => expect(getStartingTier(10)).toBe(0));
  it('returns 1 (INTERMEDIATE) for length 30', () => expect(getStartingTier(30)).toBe(1));
  it('returns 2 (AGGRESSIVE) for length 80',   () => expect(getStartingTier(80)).toBe(2));
});
