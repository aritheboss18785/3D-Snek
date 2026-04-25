import { describe, it, expect } from 'vitest';

// Pure math functions mirroring Arena logic (tested without importing THREE)
const HALF_W = 100, HALF_D = 100, CEIL_H = 80;

function isOOB(pos) {
  return pos.x < -HALF_W || pos.x > HALF_W || pos.z < -HALF_D || pos.z > HALF_D || pos.y < 0 || pos.y > CEIL_H;
}

function wallDist(pos) {
  return Math.min(pos.x + HALF_W, HALF_W - pos.x, pos.z + HALF_D, HALF_D - pos.z, pos.y, CEIL_H - pos.y);
}

const v = (x, y, z) => ({ x, y, z });

describe('Arena bounds (ARENA_W=200, ARENA_D=200, ARENA_H=80)', () => {
  it('center is in bounds', () => expect(isOOB(v(0, 0, 0))).toBe(false));
  it('past +X wall is OOB', () => expect(isOOB(v(101, 0, 0))).toBe(true));
  it('past -X wall is OOB', () => expect(isOOB(v(-101, 0, 0))).toBe(true));
  it('below floor is OOB', () => expect(isOOB(v(0, -1, 0))).toBe(true));
  it('above ceiling is OOB', () => expect(isOOB(v(0, 81, 0))).toBe(true));
});

describe('Arena wall distance', () => {
  it('center at mid-height returns min wall dist (40 to floor/ceiling)', () => expect(wallDist(v(0, 40, 0))).toBe(40));
  it('near +X wall returns correct distance', () => expect(wallDist(v(90, 40, 0))).toBe(10));
  it('at floor returns 0', () => expect(wallDist(v(0, 0, 0))).toBe(0));
});
