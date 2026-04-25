export const COLLISION_RADIUS = 2.6;
export const FOOD_RADIUS = 3.2;
export const ORB_RADIUS = 4.5;
export const PORTAL_RADIUS = 6.0;

// Pure function — testable without Three.js
export function sphereOverlap(a, b, r) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return (dx * dx + dy * dy + dz * dz) < r * r;
}

export class CollisionSystem {
  constructor(arena) {
    this.arena = arena;
  }

  check(snakes, foodSystem, portalSystem) {
    const result = {
      deaths: [],
      foodEaten: [],
      orbsCollected: [],
      portalsHit: [],
    };
    const killed = new Set();

    for (const snake of snakes) {
      if (!snake.alive) continue;
      const head = snake.headPosition;

      // Wall check
      if (this.arena.isOutOfBounds(head)) {
        if (!killed.has(snake)) { result.deaths.push(snake); killed.add(snake); }
        continue;
      }

      // Body collision vs other snakes (self excluded)
      let died = false;
      for (const other of snakes) {
        if (!other.alive || other === snake) continue;
        for (const seg of other.segments) {
          if (sphereOverlap(head, seg.position, COLLISION_RADIUS)) {
            if (!killed.has(snake)) { result.deaths.push(snake); killed.add(snake); }
            died = true;
            break;
          }
        }
        if (died) break;
      }
      if (died) continue;

      // Food collection
      if (foodSystem.checkCollection(head, FOOD_RADIUS)) {
        result.foodEaten.push(snake);
      }

      // Orb collection
      const orbGrowth = foodSystem.checkOrbCollection(head, ORB_RADIUS);
      if (orbGrowth > 0) result.orbsCollected.push({ snake, growth: orbGrowth });

      // Portal trigger
      if (portalSystem && portalSystem.active && portalSystem.checkTrigger(head)) {
        result.portalsHit.push(snake);
      }
    }

    return result;
  }
}
