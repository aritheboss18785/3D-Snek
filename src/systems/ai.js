import * as THREE from 'three';

const SCAN_RADIUS = 55;
const WALL_BUFFER = 18;
const TICK_INTERVAL = 0.1;

export const AI_TIER = Object.freeze({ BASIC: 0, INTERMEDIATE: 1, AGGRESSIVE: 2 });

const _UP = new THREE.Vector3(0, 1, 0);
const _LOOKAHEAD = new THREE.Vector3();
const _CANDIDATE_DIRS = Array.from({ length: 5 }, () => new THREE.Vector3());

export class AISystem {
  constructor() {
    this._timer = 0;
  }

  update(delta, aiSnakes, player, foodSystem, arena) {
    this._timer += delta;
    if (this._timer < TICK_INTERVAL) return;
    this._timer -= TICK_INTERVAL;

    const allSnakes = [player, ...aiSnakes];
    for (const ai of aiSnakes) {
      if (!ai.alive) continue;
      this._decide(ai, allSnakes, foodSystem, arena);
    }
  }

  _decide(ai, allSnakes, foodSystem, arena) {
    const candidates = this._candidates(ai.direction);
    let bestScore = -Infinity;
    let bestIdx = 0;

    for (let i = 0; i < candidates.length; i++) {
      const s = this._score(candidates[i], ai, allSnakes, foodSystem, arena);
      if (s > bestScore) { bestScore = s; bestIdx = i; }
    }

    ai.setDirection(candidates[bestIdx]);
  }

  _candidates(dir) {
    _CANDIDATE_DIRS[0].copy(dir);
    _CANDIDATE_DIRS[1].copy(dir).applyAxisAngle(_UP,  Math.PI / 6);
    _CANDIDATE_DIRS[2].copy(dir).applyAxisAngle(_UP, -Math.PI / 6);
    _CANDIDATE_DIRS[3].copy(dir).applyAxisAngle(_UP,  Math.PI / 3);
    _CANDIDATE_DIRS[4].copy(dir).applyAxisAngle(_UP, -Math.PI / 3);
    return _CANDIDATE_DIRS;
  }

  _score(dir, ai, allSnakes, foodSystem, arena) {
    _LOOKAHEAD.copy(ai.headPosition).addScaledVector(dir, 12);
    let score = 0;

    if (arena.isOutOfBounds(_LOOKAHEAD)) return -9999;

    const wallDist = arena.distanceToWall(_LOOKAHEAD);
    if (wallDist < WALL_BUFFER) score -= (WALL_BUFFER - wallDist) * 6;

    const nearFood = foodSystem.nearestPellet(_LOOKAHEAD, SCAN_RADIUS);
    if (nearFood) {
      score += (SCAN_RADIUS - _LOOKAHEAD.distanceTo(nearFood)) * 0.6;
    }

    if (ai.tier === AI_TIER.BASIC) return score;

    for (const other of allSnakes) {
      if (!other.alive || other === ai) continue;
      const dist = _LOOKAHEAD.distanceTo(other.headPosition);
      if (dist > SCAN_RADIUS) continue;
      const proximity = SCAN_RADIUS - dist;

      if (other.length > ai.length + 5) {
        score -= proximity * 2.5; // flee larger snakes
      } else if (ai.tier === AI_TIER.AGGRESSIVE && other.length < ai.length - 5) {
        score += proximity * 1.8; // hunt smaller snakes
      }
    }

    const nearOrb = foodSystem.nearestOrb(_LOOKAHEAD, SCAN_RADIUS);
    if (nearOrb) {
      score += (SCAN_RADIUS - _LOOKAHEAD.distanceTo(nearOrb)) * 1.1;
    }

    return score;
  }
}
