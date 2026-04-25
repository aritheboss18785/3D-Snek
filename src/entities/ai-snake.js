import { Snake } from './snake.js';
import { AI_TIER } from '../systems/ai.js';

export class AISnake extends Snake {
  constructor(scene, startPos, color, startingTier = AI_TIER.BASIC) {
    super(scene, startPos, color);
    this.tier = startingTier;
    // Face a random direction at spawn
    const angle = Math.random() * Math.PI * 2;
    this.direction.set(Math.cos(angle), 0, Math.sin(angle)).normalize();
  }

  update(delta) {
    // Upgrade tier based on current length
    if (this.length >= 35) this.tier = AI_TIER.AGGRESSIVE;
    else if (this.length >= 15) this.tier = AI_TIER.INTERMEDIATE;

    super.update(delta);
  }
}
