import { describe, it, expect } from 'vitest';
import { sphereOverlap, COLLISION_RADIUS } from './collision.js';

const v = (x, y, z) => ({ x, y, z });

describe('sphereOverlap', () => {
  it('overlaps when distance < radius', () => {
    expect(sphereOverlap(v(0,0,0), v(1,0,0), 2)).toBe(true);
  });
  it('does not overlap when distance > radius', () => {
    expect(sphereOverlap(v(0,0,0), v(5,0,0), 2)).toBe(false);
  });
  it('does not overlap at exact radius boundary', () => {
    expect(sphereOverlap(v(0,0,0), v(2,0,0), 2)).toBe(false);
  });
  it('handles 3D distance correctly', () => {
    // distance = sqrt(1+1+1) ≈ 1.73, radius = 2 → overlap
    expect(sphereOverlap(v(0,0,0), v(1,1,1), 2)).toBe(true);
  });
  it('uses COLLISION_RADIUS correctly', () => {
    expect(sphereOverlap(v(0,0,0), v(COLLISION_RADIUS - 0.1, 0, 0), COLLISION_RADIUS)).toBe(true);
    expect(sphereOverlap(v(0,0,0), v(COLLISION_RADIUS + 0.1, 0, 0), COLLISION_RADIUS)).toBe(false);
  });
});
