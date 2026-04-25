import { SceneManager } from './core/scene.js';
import { InputHandler } from './core/input.js';
import { CameraSystem } from './systems/camera.js';
import { Game, STATE } from './core/game.js';
import { Arena } from './world/arena.js';
import { FoodSystem } from './world/food.js';
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
const player = new Player(sceneManager.scene, input);
const collisionSystem = new CollisionSystem(arena);
const aiSystem = new AISystem();
const spawnSystem = new SpawnSystem(sceneManager.scene, arena);

game.player = player;

const aiSnakes = [];

function addAI(pos, color, tier) {
  aiSnakes.push(new AISnake(sceneManager.scene, pos, color, tier));
}
function removeAI(snake) {
  const idx = aiSnakes.indexOf(snake);
  if (idx !== -1) aiSnakes.splice(idx, 1);
}

game.update = function(delta) {
  if (game.state !== STATE.PLAYING && game.state !== STATE.CHAOS) return;

  player.update(delta);
  aiSnakes.forEach(ai => ai.update(delta));
  aiSystem.update(delta, aiSnakes, player, foodSystem, arena);
  foodSystem.update(delta);

  spawnSystem.update(player.length, player.headPosition, aiSnakes, addAI, removeAI);

  cameraSystem.update(
    delta,
    player.headPosition,
    player.direction,
    player.length,
    game.state === STATE.CHAOS
  );

  const allSnakes = [player, ...aiSnakes];
  const result = collisionSystem.check(allSnakes, foodSystem, null);

  result.deaths.forEach(snake => {
    snake.die((positions, color) => foodSystem.spawnOrbs(positions, color));
    if (snake === player) {
      game.state = STATE.DEAD;
      console.log('GAME OVER — Score:', game.score, 'Kills:', game.kills);
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
};

game.start();
