import * as THREE from 'three';
import { SceneManager } from './core/scene.js';
import { InputHandler } from './core/input.js';
import { CameraSystem } from './systems/camera.js';
import { Game, STATE } from './core/game.js';

const container = document.getElementById('canvas-container');

const sceneManager = new SceneManager(container);
const input = new InputHandler();
const cameraSystem = new CameraSystem(sceneManager.camera);
const game = new Game(sceneManager, input, cameraSystem);

// Temporary test cube — removed when snake entity is implemented in Task 4
const testCube = new THREE.Mesh(
  new THREE.BoxGeometry(4, 4, 4),
  new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 0.4 })
);
sceneManager.scene.add(testCube);

const fakeDir = new THREE.Vector3(1, 0, 0);

game.update = function(delta) {
  cameraSystem.update(delta, testCube.position, fakeDir, 5, false);
};

game.start();
