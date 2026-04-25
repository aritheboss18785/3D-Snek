import * as THREE from 'three';
import { SceneManager } from './core/scene.js';
import { InputHandler } from './core/input.js';
import { CameraSystem } from './systems/camera.js';
import { Game, STATE } from './core/game.js';
import { Arena } from './world/arena.js';
import { FoodSystem } from './world/food.js';

const container = document.getElementById('canvas-container');

const sceneManager = new SceneManager(container);
const input = new InputHandler();
const cameraSystem = new CameraSystem(sceneManager.camera);
const game = new Game(sceneManager, input, cameraSystem);

const arena = new Arena(sceneManager.scene);
const foodSystem = new FoodSystem(sceneManager.scene, arena);

// Temp: static overhead camera to verify arena and food visually
sceneManager.camera.position.set(0, 200, 0);
sceneManager.camera.lookAt(0, 0, 0);

game.update = function(delta) {
  foodSystem.update(delta);
};

game.start();
