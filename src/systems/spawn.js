const SPAWN_TABLE = [
  [0,   20,  3],
  [21,  50,  5],
  [51,  100, 8],
  [101, Infinity, 10],
];

export function getTargetCount(playerLength) {
  for (const [min, max, count] of SPAWN_TABLE) {
    if (playerLength >= min && playerLength <= max) return count;
  }
  return 3;
}

export function getStartingTier(playerLength) {
  if (playerLength < 20)  return 0; // BASIC
  if (playerLength < 60)  return 1; // INTERMEDIATE
  return 2;                          // AGGRESSIVE
}

export const AI_COLORS = [
  0xff4444, 0x44ff88, 0xffaa00,
  0xff44ff, 0x00ffff, 0xff8800,
  0xaaff00, 0xff0088,
];

export class SpawnSystem {
  constructor(scene, arena) {
    this.scene = scene;
    this.arena = arena;
    this._colorIdx = 0;
  }

  update(playerLength, playerPos, aiSnakes, onAdd, onRemove) {
    // Remove dead snakes first
    for (const s of [...aiSnakes]) {
      if (!s.alive) onRemove(s);
    }

    const alive = aiSnakes.filter(s => s.alive);
    const target = getTargetCount(playerLength);

    while (alive.length < target) {
      const color = AI_COLORS[this._colorIdx % AI_COLORS.length];
      this._colorIdx++;
      const pos = this.arena.randomEdgePosition();
      const tier = getStartingTier(playerLength);
      onAdd(pos, color, tier);
      alive.push({}); // placeholder to prevent over-spawning this tick
    }
  }
}
