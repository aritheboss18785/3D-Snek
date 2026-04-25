import { SceneManager } from './core/scene.js';
import { InputHandler } from './core/input.js';
import { CameraSystem } from './systems/camera.js';
import { Game, STATE } from './core/game.js';
import { Arena } from './world/arena.js';
import { FoodSystem } from './world/food.js';
import { PortalSystem } from './world/portal.js';
import { Player } from './entities/player.js';
import { AISnake } from './entities/ai-snake.js';
import { CollisionSystem } from './systems/collision.js';
import { AISystem } from './systems/ai.js';
import { SpawnSystem } from './systems/spawn.js';

const container = document.getElementById('canvas-container');

const sceneManager = new SceneManager(container);
const input = new InputHandler();
const cameraSystem = new CameraSystem(sceneManager.camera);
const game = new Game(sceneManager, input, cameraSystem);

const arena = new Arena(sceneManager.scene);
const foodSystem = new FoodSystem(sceneManager.scene, arena);
const portalSystem = new PortalSystem(sceneManager.scene, arena);
const player = new Player(sceneManager.scene, input);
const collisionSystem = new CollisionSystem(arena);
const aiSystem = new AISystem();
const spawnSystem = new SpawnSystem(sceneManager.scene, arena);

game.player = player;
game.portalSystem = portalSystem;

const aiSnakes = [];

function addAI(pos, color, tier) {
  const ai = new AISnake(sceneManager.scene, pos, color, tier);
  // If currently in chaos, new AI snakes also get vertical movement
  if (game.state === STATE.CHAOS) ai.canMoveVertical = true;
  aiSnakes.push(ai);
}

function removeAI(snake) {
  const idx = aiSnakes.indexOf(snake);
  if (idx !== -1) aiSnakes.splice(idx, 1);
}

game.update = function(delta) {
  if (game.state !== STATE.PLAYING && game.state !== STATE.CHAOS) return;

  // Chaos timer countdown
  if (game.state === STATE.CHAOS) {
    game.chaosTimer -= delta;
    if (game.chaosTimer <= 0) {
      // End chaos
      game._endChaos(); // sets state=PLAYING, calls portalSystem.respawnAll() + setActive(true)
      player.canMoveVertical = false;
      player._headPos.y = 0;
      player.direction.y = 0;
      player.direction.normalize();
      aiSnakes.forEach(s => { s.canMoveVertical = false; });
    }
  }

  player.update(delta);
  aiSnakes.forEach(ai => ai.update(delta));
  aiSystem.update(delta, aiSnakes, player, foodSystem, arena);
  foodSystem.update(delta);
  portalSystem.update(delta);

  spawnSystem.update(player.length, player.headPosition, aiSnakes, addAI, removeAI);

  cameraSystem.update(
    delta,
    player.headPosition,
    player.direction,
    player.length,
    game.state === STATE.CHAOS
  );

  const allSnakes = [player, ...aiSnakes];
  const result = collisionSystem.check(allSnakes, foodSystem, portalSystem);

  result.deaths.forEach(snake => {
    snake.die((positions, color) => foodSystem.spawnOrbs(positions, color));
    if (snake === player) {
      game.state = STATE.DEAD;
    } else {
      game.kills++;
      game.score += 100;
    }
  });

  result.foodEaten.forEach(snake => {
    snake.grow(2);
    if (snake === player) game.score += 10;
  });

  result.orbsCollected.forEach(({ snake, growth }) => {
    snake.grow(growth);
    if (snake === player) game.score += growth * 5;
  });

  // Handle portal triggers — enter chaos if not already in it
  if (result.portalsHit.length > 0 && game.state !== STATE.CHAOS) {
    // enterChaos() calls portalSystem.setActive(false), preventing re-trigger this frame
    game.enterChaos(); // sets state=CHAOS, chaosTimer=30, player.canMoveVertical=true, portalSystem.setActive(false)
    // Also enable vertical for all AI snakes
    aiSnakes.forEach(s => { s.canMoveVertical = true; });
  }
};

game.start();
