import * as THREE from 'three';
import { SceneManager } from './core/scene.js';
import { InputHandler } from './core/input.js';
import { CameraSystem } from './systems/camera.js';
import { Game, STATE } from './core/game.js';
import { Arena } from './world/arena.js';
import { FoodSystem } from './world/food.js';
import { Player } from './entities/player.js';
import { CollisionSystem } from './systems/collision.js';

const container = document.getElementById('canvas-container');

const sceneManager = new SceneManager(container);
const input = new InputHandler();
const cameraSystem = new CameraSystem(sceneManager.camera);
const game = new Game(sceneManager, input, cameraSystem);

const arena = new Arena(sceneManager.scene);
const foodSystem = new FoodSystem(sceneManager.scene, arena);
const player = new Player(sceneManager.scene, input);
const collisionSystem = new CollisionSystem(arena);

game.player = player;
game.arena = arena;
game.foodSystem = foodSystem;
game.collisionSystem = collisionSystem;

game.update = function(delta) {
  if (game.state !== STATE.PLAYING && game.state !== STATE.CHAOS) return;

  player.update(delta);
  foodSystem.update(delta);
  cameraSystem.update(delta, player.headPosition, player.direction, player.length, game.state === STATE.CHAOS);

  const result = collisionSystem.check([player], foodSystem, null);

  result.deaths.forEach(s => {
    s.die((positions, color) => foodSystem.spawnOrbs(positions, color));
    console.log('Player died! Score:', game.score);
    game.state = STATE.DEAD;
  });

  result.foodEaten.forEach(s => {
    s.grow(2);
    game.score += 10;
  });

  result.orbsCollected.forEach(({ snake, growth }) => {
    snake.grow(growth);
    if (snake === player) game.score += growth * 5;
  });
};

game.start();
