# 3D Snake Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based 3D snake game with Slither.io rules, adaptive AI opponents, and portal-triggered chaos mode using Vite and Three.js.

**Architecture:** Trail-based continuous snake movement on a flat 200×200×80 unit arena. Third-person follow camera. Central `Game` class owns all systems and runs the requestAnimationFrame loop. AI runs a 100ms decision loop using local steering. State machine: `menu → playing ↔ chaos → dead → menu`.

**Tech Stack:** Vite 5, Three.js ^0.170.0, Vitest (unit tests for pure logic functions)

---

### Task 1: Set up Vite + Three.js project scaffold

**Goal:** Initialize Vite project with Three.js, Vitest, correct folder structure, and a black canvas on screen.

**Files:**
- Create: `package.json` (via npm init)
- Create: `index.html`
- Create: `vite.config.js`
- Create: `src/main.js`
- Create: `src/core/`, `src/entities/`, `src/world/`, `src/systems/`, `src/ui/` (empty dirs with `.gitkeep`)

**Acceptance Criteria:**
- [ ] `npm run dev` opens browser with black full-screen canvas, no console errors
- [ ] `npm run test` runs Vitest with 0 tests (passes with no test files)
- [ ] All module directories exist under `src/`

**Verify:** `npm run dev` → browser shows black screen. `npm run test` → "no test files found".

**Steps:**

- [ ] **Step 1: Scaffold Vite project**

Run from `/Users/emperorfrozen/Random`:
```bash
npm create vite@latest . -- --template vanilla
```
When prompted about existing files, select "Ignore files and continue".

- [ ] **Step 2: Install dependencies**

```bash
npm install three
npm install --save-dev vitest
```

- [ ] **Step 3: Replace `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>3D Snake</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #000; overflow: hidden; }
      #canvas-container { width: 100vw; height: 100vh; }
      #hud {
        position: fixed; top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none; z-index: 10;
      }
    </style>
  </head>
  <body>
    <div id="canvas-container"></div>
    <div id="hud"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Replace `vite.config.js`**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 5: Replace `src/main.js`**

```js
import * as THREE from 'three';

const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x050a14);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 50, -80);
camera.lookAt(0, 0, 0);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

function loop() {
  requestAnimationFrame(loop);
  renderer.render(scene, camera);
}
loop();
```

- [ ] **Step 6: Create empty module directories**

```bash
mkdir -p src/core src/entities src/world src/systems src/ui
touch src/core/.gitkeep src/entities/.gitkeep src/world/.gitkeep src/systems/.gitkeep src/ui/.gitkeep
```

- [ ] **Step 7: Update `package.json` scripts to include test**

Add to the `"scripts"` section of `package.json`:
```json
"test": "vitest run"
```

- [ ] **Step 8: Verify**

```bash
npm run dev
```
Open browser → black screen, no console errors.

```bash
npm run test
```
Expected output: passes (no test files).

- [ ] **Step 9: Commit**

```bash
git init
git add index.html vite.config.js package.json package-lock.json src/
git commit -m "feat: scaffold Vite + Three.js project"
```

---

### Task 2: Implement Scene, Game Loop, Input & Camera

**Goal:** Core Three.js scene with renderer/lighting, delta-time game loop with state machine, keyboard input, and a third-person follow camera that transitions during chaos mode.

**Files:**
- Create: `src/core/scene.js`
- Create: `src/core/game.js`
- Create: `src/core/input.js`
- Create: `src/systems/camera.js`
- Modify: `src/main.js`

**Acceptance Criteria:**
- [ ] Scene has ambient + directional lighting with navy background
- [ ] Game loop runs with capped delta time (max 50ms)
- [ ] `STATE` enum exported from `game.js`
- [ ] Input captures arrow keys and WASD; `left`, `right`, `up`, `down` booleans
- [ ] Camera smoothly lerps behind a test object; FOV changes when `isChaos` set to true

**Verify:** `npm run dev` → dark navy scene with lighting visible on a test cube. Camera follows it.

**Steps:**

- [ ] **Step 1: Create `src/core/scene.js`**

```js
import * as THREE from 'three';

export class SceneManager {
  constructor(container) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x050a14);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050a14, 0.003);

    this.camera = new THREE.PerspectiveCamera(
      70, window.innerWidth / window.innerHeight, 0.1, 2000
    );
    this.camera.position.set(0, 50, -80);

    const ambient = new THREE.AmbientLight(0x223366, 0.8);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    this.scene.add(sun);

    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
```

- [ ] **Step 2: Create `src/core/input.js`**

```js
export class InputHandler {
  constructor() {
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;

    window.addEventListener('keydown', e => this._onKey(e.code, true));
    window.addEventListener('keyup', e => this._onKey(e.code, false));
  }

  _onKey(code, pressed) {
    switch (code) {
      case 'ArrowLeft':  case 'KeyA': this.left  = pressed; break;
      case 'ArrowRight': case 'KeyD': this.right = pressed; break;
      case 'ArrowUp':    case 'KeyW': this.up    = pressed; break;
      case 'ArrowDown':  case 'KeyS': this.down  = pressed; break;
    }
  }

  destroy() {
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('keyup', this._onKey);
  }
}
```

- [ ] **Step 3: Create `src/systems/camera.js`**

```js
import * as THREE from 'three';

const NORMAL_BEHIND = -28;
const NORMAL_ABOVE = 14;
const CHAOS_BEHIND = -80;
const CHAOS_ABOVE = 60;
const NORMAL_FOV = 70;
const CHAOS_FOV = 90;
const LERP_SPEED = 8;

export class CameraSystem {
  constructor(camera) {
    this.camera = camera;
    this._lookAtTarget = new THREE.Vector3();
  }

  update(delta, headPos, direction, snakeLength, isChaos) {
    const fwd = direction.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);

    const behind = isChaos ? CHAOS_BEHIND : NORMAL_BEHIND - snakeLength * 0.1;
    const above  = isChaos ? CHAOS_ABOVE  : NORMAL_ABOVE;

    const targetPos = headPos.clone()
      .addScaledVector(fwd, behind)
      .addScaledVector(up, above);

    this.camera.position.lerp(targetPos, LERP_SPEED * delta);

    const lookAt = headPos.clone().addScaledVector(fwd, 12);
    this._lookAtTarget.lerp(lookAt, LERP_SPEED * delta);
    this.camera.lookAt(this._lookAtTarget);

    const targetFov = isChaos ? CHAOS_FOV : NORMAL_FOV;
    this.camera.fov += (targetFov - this.camera.fov) * 5 * delta;
    this.camera.updateProjectionMatrix();
  }
}
```

- [ ] **Step 4: Create `src/core/game.js`**

```js
export const STATE = Object.freeze({
  MENU: 'menu',
  PLAYING: 'playing',
  CHAOS: 'chaos',
  DEAD: 'dead',
});

export class Game {
  constructor(sceneManager, input, cameraSystem) {
    this.sceneManager = sceneManager;
    this.input = input;
    this.cameraSystem = cameraSystem;

    this.state = STATE.MENU;
    this.score = 0;
    this.kills = 0;
    this.chaosTimer = 0;

    this._lastTime = 0;
    this._rafId = null;

    // Systems/entities set by main.js after construction
    this.player = null;
    this.aiSnakes = [];
    this.arena = null;
    this.foodSystem = null;
    this.portalSystem = null;
    this.collisionSystem = null;
    this.spawnSystem = null;
    this.hud = null;
    this.gameOver = null;
  }

  start() {
    this.state = STATE.PLAYING;
    this._lastTime = performance.now();
    this._rafId = requestAnimationFrame(t => this._loop(t));
  }

  _loop(time) {
    const delta = Math.min((time - this._lastTime) / 1000, 0.05);
    this._lastTime = time;
    this.update(delta);
    this.sceneManager.render();
    this._rafId = requestAnimationFrame(t => this._loop(t));
  }

  update(delta) {
    if (this.state !== STATE.PLAYING && this.state !== STATE.CHAOS) return;

    if (this.state === STATE.CHAOS) {
      this.chaosTimer -= delta;
      if (this.chaosTimer <= 0) this._endChaos();
    }
    // Game systems will be wired in later tasks
  }

  enterChaos() {
    this.state = STATE.CHAOS;
    this.chaosTimer = 30;
    if (this.player) this.player.canMoveVertical = true;
    if (this.portalSystem) this.portalSystem.setActive(false);
  }

  _endChaos() {
    this.state = STATE.PLAYING;
    this.chaosTimer = 0;
    if (this.player) this.player.canMoveVertical = false;
    if (this.portalSystem) {
      this.portalSystem.respawnAll();
      this.portalSystem.setActive(true);
    }
  }

  handlePlayerDeath() {
    this.state = STATE.DEAD;
    if (this.gameOver) {
      this.gameOver.show(this.player.length, this.score, this.kills);
    }
  }

  restart() {
    // Cancel current loop
    if (this._rafId) cancelAnimationFrame(this._rafId);
    // Full page reload is the simplest clean restart
    window.location.reload();
  }
}
```

- [ ] **Step 5: Update `src/main.js` to wire scene + game loop**

```js
import { SceneManager } from './core/scene.js';
import { InputHandler } from './core/input.js';
import { CameraSystem } from './systems/camera.js';
import { Game } from './core/game.js';
import * as THREE from 'three';

const container = document.getElementById('canvas-container');
const hudEl = document.getElementById('hud');

const sceneManager = new SceneManager(container);
const input = new InputHandler();
const cameraSystem = new CameraSystem(sceneManager.camera);
const game = new Game(sceneManager, input, cameraSystem);

// Temporary: test cube so camera has something to follow
const testCube = new THREE.Mesh(
  new THREE.BoxGeometry(4, 4, 4),
  new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 0.4 })
);
sceneManager.scene.add(testCube);

const fakeDir = new THREE.Vector3(1, 0, 0);

// Override game loop to test camera
const origStart = game.start.bind(game);
game.start = function() {
  game.state = 'playing';
  game._lastTime = performance.now();
  game._rafId = requestAnimationFrame(function loop(t) {
    const delta = Math.min((t - game._lastTime) / 1000, 0.05);
    game._lastTime = t;
    cameraSystem.update(delta, testCube.position, fakeDir, 5, false);
    sceneManager.render();
    game._rafId = requestAnimationFrame(loop);
  });
};

game.start();
```

- [ ] **Step 6: Verify**

```bash
npm run dev
```
Open browser → dark navy scene, test cube visible, camera positioned behind and above it. No console errors.

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat: add scene, game loop, input, and camera system"
```

---

### Task 3: Implement Arena & Food System

**Goal:** Visible bounded arena (200×200×80 wireframe box with glowing grid floor), food pellets that respawn on collection, and orbs that drop from dead snakes, pulse, drift up, and despawn.

**Files:**
- Create: `src/world/arena.js`
- Create: `src/world/food.js`
- Modify: `src/main.js` (add arena + food to scene for visual verification)

**Acceptance Criteria:**
- [ ] Wireframe arena box visible at correct dimensions
- [ ] Grid floor spans arena floor
- [ ] 100 food pellets visible as glowing yellow-white spheres
- [ ] `arena.isOutOfBounds(pos)` returns true outside bounds
- [ ] `arena.distanceToWall(pos)` returns correct minimum wall distance
- [ ] `foodSystem.checkCollection` removes and respawns a pellet when called with overlapping position

**Verify:** `npm run test` → all arena/food unit tests pass. `npm run dev` → arena and food visible.

**Steps:**

- [ ] **Step 1: Create `src/world/arena.js`**

```js
import * as THREE from 'three';

export const ARENA_W = 200;
export const ARENA_D = 200;
export const ARENA_H = 80;

export class Arena {
  constructor(scene) {
    this.halfW = ARENA_W / 2;
    this.halfD = ARENA_D / 2;
    this.halfH = ARENA_H;
    this._build(scene);
  }

  _build(scene) {
    // Wireframe box
    const boxGeo = new THREE.BoxGeometry(ARENA_W, ARENA_H, ARENA_D);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x224466, transparent: true, opacity: 0.6 });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    wireframe.position.set(0, ARENA_H / 2, 0);
    scene.add(wireframe);

    // Grid floor
    const grid = new THREE.GridHelper(ARENA_W, 40, 0x113355, 0x0a1a2a);
    grid.position.set(0, 0.01, 0);
    scene.add(grid);

    // Solid floor (receives shadows)
    const floorGeo = new THREE.PlaneGeometry(ARENA_W, ARENA_D);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x050f1a, roughness: 1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
  }

  isOutOfBounds(pos) {
    return (
      pos.x < -this.halfW || pos.x > this.halfW ||
      pos.z < -this.halfD || pos.z > this.halfD ||
      pos.y < 0 || pos.y > this.halfH
    );
  }

  distanceToWall(pos) {
    return Math.min(
      pos.x + this.halfW,
      this.halfW - pos.x,
      pos.z + this.halfD,
      this.halfD - pos.z,
      pos.y,
      this.halfH - pos.y
    );
  }

  randomFloorPosition(margin = 10) {
    return new THREE.Vector3(
      (Math.random() - 0.5) * (ARENA_W - margin * 2),
      0,
      (Math.random() - 0.5) * (ARENA_D - margin * 2)
    );
  }

  randomEdgePosition() {
    const edge = Math.floor(Math.random() * 4);
    const t = (Math.random() - 0.5) * (ARENA_W - 20);
    const m = 5;
    switch (edge) {
      case 0: return new THREE.Vector3(-this.halfW + m, 0, t);
      case 1: return new THREE.Vector3( this.halfW - m, 0, t);
      case 2: return new THREE.Vector3(t, 0, -this.halfD + m);
      default: return new THREE.Vector3(t, 0,  this.halfD - m);
    }
  }
}
```

- [ ] **Step 2: Create `src/world/food.js`**

```js
import * as THREE from 'three';

const FOOD_COUNT = 100;
const FOOD_GEO = new THREE.SphereGeometry(0.8, 8, 6);
const ORB_GEO = new THREE.SphereGeometry(1.5, 8, 8);

export class FoodSystem {
  constructor(scene, arena) {
    this.scene = scene;
    this.arena = arena;
    this.pellets = [];
    this.orbs = [];

    for (let i = 0; i < FOOD_COUNT; i++) this._spawnPellet();
  }

  _spawnPellet() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffaa,
      emissive: 0xffffaa,
      emissiveIntensity: 0.9,
    });
    const mesh = new THREE.Mesh(FOOD_GEO, mat);
    mesh.position.copy(this.arena.randomFloorPosition());
    mesh.position.y = 0.8;
    this.scene.add(mesh);
    this.pellets.push(mesh);
  }

  checkCollection(headPos, radius) {
    for (const p of this.pellets) {
      const dx = headPos.x - p.position.x;
      const dz = headPos.z - p.position.z;
      if (dx * dx + dz * dz < radius * radius) {
        p.position.copy(this.arena.randomFloorPosition());
        p.position.y = 0.8;
        return true;
      }
    }
    return false;
  }

  checkOrbCollection(headPos, radius) {
    let growth = 0;
    this.orbs = this.orbs.filter(orb => {
      const d = headPos.distanceTo(orb.mesh.position);
      if (d < radius) {
        this.scene.remove(orb.mesh);
        orb.mesh.material.dispose();
        growth += 3;
        return false;
      }
      return true;
    });
    return growth;
  }

  spawnOrbs(trailPositions, color) {
    const step = Math.max(1, Math.floor(trailPositions.length / 20));
    for (let i = 0; i < trailPositions.length; i += step) {
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.2,
      });
      const mesh = new THREE.Mesh(ORB_GEO, mat);
      mesh.position.copy(trailPositions[i]);
      mesh.position.y = Math.max(mesh.position.y, 1.5);
      this.scene.add(mesh);
      this.orbs.push({ mesh, timer: 15, phase: Math.random() * Math.PI * 2 });
    }
  }

  nearestPellet(pos, radius) {
    let best = null, bestDist = radius * radius;
    for (const p of this.pellets) {
      const dx = pos.x - p.position.x, dz = pos.z - p.position.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestDist) { bestDist = d2; best = p.position; }
    }
    return best;
  }

  nearestOrb(pos, radius) {
    let best = null, bestDist = radius * radius;
    for (const orb of this.orbs) {
      const d2 = pos.distanceToSquared(orb.mesh.position);
      if (d2 < bestDist) { bestDist = d2; best = orb.mesh.position; }
    }
    return best;
  }

  update(delta) {
    this.orbs = this.orbs.filter(orb => {
      orb.timer -= delta;
      if (orb.timer <= 0) {
        this.scene.remove(orb.mesh);
        orb.mesh.material.dispose();
        return false;
      }
      orb.phase += delta * 3;
      orb.mesh.material.emissiveIntensity = 0.6 + 0.6 * Math.sin(orb.phase);
      orb.mesh.position.y += delta * 0.4;
      return true;
    });
  }
}
```

- [ ] **Step 3: Write unit tests — create `src/world/arena.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { Arena, ARENA_W, ARENA_D, ARENA_H } from './arena.js';

// Stub THREE for node environment
const mockVec3 = (x, y, z) => ({ x, y, z });

describe('Arena.isOutOfBounds', () => {
  const arena = { halfW: ARENA_W/2, halfD: ARENA_D/2, halfH: ARENA_H };
  arena.isOutOfBounds = Arena.prototype.isOutOfBounds.bind(arena);

  it('returns false for center', () => {
    expect(arena.isOutOfBounds(mockVec3(0, 0, 0))).toBe(false);
  });
  it('returns true past +X wall', () => {
    expect(arena.isOutOfBounds(mockVec3(101, 0, 0))).toBe(true);
  });
  it('returns true past -X wall', () => {
    expect(arena.isOutOfBounds(mockVec3(-101, 0, 0))).toBe(true);
  });
  it('returns true below floor', () => {
    expect(arena.isOutOfBounds(mockVec3(0, -1, 0))).toBe(true);
  });
  it('returns true above ceiling', () => {
    expect(arena.isOutOfBounds(mockVec3(0, 81, 0))).toBe(true);
  });
});

describe('Arena.distanceToWall', () => {
  const arena = { halfW: ARENA_W/2, halfD: ARENA_D/2, halfH: ARENA_H };
  arena.distanceToWall = Arena.prototype.distanceToWall.bind(arena);

  it('returns halfW at center X', () => {
    expect(arena.distanceToWall(mockVec3(0, 40, 0))).toBe(100);
  });
  it('returns correct distance near +X wall', () => {
    expect(arena.distanceToWall(mockVec3(90, 40, 0))).toBe(10);
  });
  it('returns 0 at floor', () => {
    expect(arena.distanceToWall(mockVec3(0, 0, 0))).toBe(0);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npm run test
```
Expected: 8 tests pass, 0 fail.

- [ ] **Step 5: Update `src/main.js` to show arena + food**

Replace the contents of `src/main.js`:

```js
import { SceneManager } from './core/scene.js';
import { InputHandler } from './core/input.js';
import { CameraSystem } from './systems/camera.js';
import { Game } from './core/game.js';
import { Arena } from './world/arena.js';
import { FoodSystem } from './world/food.js';
import * as THREE from 'three';

const container = document.getElementById('canvas-container');
const hudEl = document.getElementById('hud');

const sceneManager = new SceneManager(container);
const input = new InputHandler();
const cameraSystem = new CameraSystem(sceneManager.camera);
const game = new Game(sceneManager, input, cameraSystem);

const arena = new Arena(sceneManager.scene);
const foodSystem = new FoodSystem(sceneManager.scene, arena);

// Temp: static camera overview
sceneManager.camera.position.set(0, 200, 0);
sceneManager.camera.lookAt(0, 0, 0);

game._loop = function(time) {
  const delta = Math.min((time - game._lastTime) / 1000, 0.05);
  game._lastTime = time;
  foodSystem.update(delta);
  sceneManager.render();
  game._rafId = requestAnimationFrame(t => game._loop(t));
};
game._lastTime = performance.now();
game._rafId = requestAnimationFrame(t => game._loop(t));
```

- [ ] **Step 6: Verify visually**

```bash
npm run dev
```
Expected: Top-down view of arena grid, wireframe box walls, 100 glowing yellow pellets scattered on floor.

- [ ] **Step 7: Commit**

```bash
git add src/world/ src/main.js
git commit -m "feat: add arena boundaries and food/orb system"
```

---

### Task 4: Implement Snake Entity, Player & Collision System

**Goal:** Base Snake class with trail-based continuous movement, Player subclass driven by input, and collision detection (head-vs-body, head-vs-wall, food/orb collection). Player moves around arena, grows on eating, dies on wall.

**Files:**
- Create: `src/entities/snake.js`
- Create: `src/entities/player.js`
- Create: `src/systems/collision.js`
- Create: `src/systems/collision.test.js`
- Modify: `src/main.js`

**Acceptance Criteria:**
- [ ] Player snake moves continuously forward, steers with left/right keys
- [ ] Snake segments trail behind head smoothly
- [ ] Eating a food pellet grows the snake by 2 segments
- [ ] Hitting arena wall kills the snake (triggers game over log)
- [ ] Self-collision never triggers death
- [ ] `sphereOverlap` pure function tested

**Verify:** `npm run test` → collision tests pass. `npm run dev` → player snake moves, grows, dies on wall.

**Steps:**

- [ ] **Step 1: Create `src/entities/snake.js`**

```js
import * as THREE from 'three';

const SEGMENT_SPACING = 2.8;
const HEAD_RADIUS = 1.4;
const BODY_RADIUS = 1.1;

export class Snake {
  constructor(scene, startPos, color) {
    this.scene = scene;
    this.color = color;
    this.alive = true;
    this.canMoveVertical = false;

    this._headPos = startPos.clone();
    this.direction = new THREE.Vector3(1, 0, 0);
    this.speed = 22;
    this.turnSpeed = 2.4;

    this.trail = [startPos.clone()];
    this._distAccum = 0;
    this.targetLength = 6;
    this.growthQueue = 0;
    this.segments = [];

    for (let i = 0; i < this.targetLength; i++) this._addSegment(i === 0);
  }

  get headPosition() { return this._headPos; }
  get length() { return this.targetLength; }

  _addSegment(isHead = false) {
    const r = isHead ? HEAD_RADIUS : BODY_RADIUS;
    const geo = new THREE.SphereGeometry(r, 10, 8);
    const mat = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: isHead ? 0.6 : 0.25,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const last = this.segments.length > 0
      ? this.segments[this.segments.length - 1].position.clone()
      : this._headPos.clone();
    mesh.position.copy(last);
    this.scene.add(mesh);
    this.segments.push(mesh);
  }

  steerHorizontal(sign, delta) {
    const axis = new THREE.Vector3(0, 1, 0);
    this.direction.applyAxisAngle(axis, sign * this.turnSpeed * delta);
    this.direction.normalize();
  }

  steerVertical(sign, delta) {
    const right = new THREE.Vector3()
      .crossVectors(this.direction, new THREE.Vector3(0, 1, 0))
      .normalize();
    this.direction.applyAxisAngle(right, sign * this.turnSpeed * delta);
    this.direction.normalize();
  }

  setDirection(dir) {
    this.direction.copy(dir).normalize();
  }

  update(delta) {
    const moveDist = this.speed * delta;
    this._headPos.addScaledVector(this.direction, moveDist);
    this._distAccum += moveDist;

    if (this._distAccum >= SEGMENT_SPACING) {
      this._distAccum -= SEGMENT_SPACING;
      this.trail.unshift(this._headPos.clone());

      if (this.growthQueue > 0) {
        this.growthQueue--;
      } else {
        const max = this.targetLength + 4;
        if (this.trail.length > max) this.trail.length = max;
      }

      while (this.segments.length < this.targetLength) {
        this._addSegment(false);
      }
    } else {
      this.trail[0] = this._headPos.clone();
    }

    // Sync mesh positions
    this.segments[0].position.copy(this._headPos);
    for (let i = 1; i < this.segments.length; i++) {
      const idx = Math.min(i, this.trail.length - 1);
      this.segments[i].position.copy(this.trail[idx]);
    }
  }

  grow(amount) {
    this.targetLength += amount;
    this.growthQueue += amount;
  }

  die(onDie) {
    this.alive = false;
    const positions = this.trail.slice();
    this.segments.forEach(s => {
      this.scene.remove(s);
      s.geometry.dispose();
      s.material.dispose();
    });
    this.segments = [];
    if (onDie) onDie(positions, this.color);
  }
}
```

- [ ] **Step 2: Create `src/entities/player.js`**

```js
import { Snake } from './snake.js';
import * as THREE from 'three';

export class Player extends Snake {
  constructor(scene, input) {
    super(scene, new THREE.Vector3(0, 0, 0), 0x00aaff);
    this.input = input;
  }

  update(delta) {
    if (this.input.left)  this.steerHorizontal( 1, delta);
    if (this.input.right) this.steerHorizontal(-1, delta);
    if (this.canMoveVertical) {
      if (this.input.up)   this.steerVertical( 1, delta);
      if (this.input.down) this.steerVertical(-1, delta);
    }
    super.update(delta);
  }
}
```

- [ ] **Step 3: Create `src/systems/collision.js`**

```js
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
      foodEaten: [],    // [snake]
      orbsCollected: [], // [{snake, growth}]
      portalsHit: [],   // [snake]
    };

    for (const snake of snakes) {
      if (!snake.alive) continue;
      const head = snake.headPosition;

      // Wall
      if (this.arena.isOutOfBounds(head)) {
        result.deaths.push(snake);
        continue;
      }

      // Body collision vs other snakes (self excluded)
      let died = false;
      for (const other of snakes) {
        if (!other.alive || other === snake) continue;
        for (let i = 0; i < other.segments.length; i++) {
          if (sphereOverlap(head, other.segments[i].position, COLLISION_RADIUS)) {
            result.deaths.push(snake);
            died = true;
            break;
          }
        }
        if (died) break;
      }
      if (died) continue;

      // Food
      if (foodSystem.checkCollection(head, FOOD_RADIUS)) {
        result.foodEaten.push(snake);
      }

      // Orbs
      const orbGrowth = foodSystem.checkOrbCollection(head, ORB_RADIUS);
      if (orbGrowth > 0) result.orbsCollected.push({ snake, growth: orbGrowth });

      // Portal (only triggers in PLAYING state)
      if (portalSystem && portalSystem.active && portalSystem.checkTrigger(head)) {
        result.portalsHit.push(snake);
      }
    }

    return result;
  }
}
```

- [ ] **Step 4: Create `src/systems/collision.test.js`**

```js
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
```

- [ ] **Step 5: Run tests**

```bash
npm run test
```
Expected: all tests pass (arena tests + 5 new collision tests).

- [ ] **Step 6: Update `src/main.js` to wire player into game**

```js
import { SceneManager } from './core/scene.js';
import { InputHandler } from './core/input.js';
import { CameraSystem } from './systems/camera.js';
import { Game, STATE } from './core/game.js';
import { Arena } from './world/arena.js';
import { FoodSystem } from './world/food.js';
import { Player } from './entities/player.js';
import { CollisionSystem } from './systems/collision.js';

const container = document.getElementById('canvas-container');
const hudEl = document.getElementById('hud');

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
    s.die(positions => foodSystem.spawnOrbs(positions, s.color));
    console.log('Player died! Score:', game.score);
    game.state = STATE.DEAD;
  });

  result.foodEaten.forEach(s => {
    s.grow(2);
    game.score += 10;
  });

  result.orbsCollected.forEach(({ snake, growth }) => {
    snake.grow(growth);
    game.score += growth * 5;
  });
};

game.start();
```

- [ ] **Step 7: Verify visually**

```bash
npm run dev
```
Expected: Electric-blue player snake moves forward, steers with A/D or arrow keys, grows when eating yellow pellets, console logs "Player died!" when hitting wall.

- [ ] **Step 8: Commit**

```bash
git add src/entities/ src/systems/collision.js src/systems/collision.test.js src/main.js
git commit -m "feat: add snake entity, player controls, and collision system"
```

---

### Task 5: Implement AI Snakes, Behavior Tiers & Spawn System

**Goal:** AI-controlled snakes with 3 behavior tiers (basic/intermediate/aggressive), adaptive difficulty, inter-AI competition, and spawn scaling based on player length.

**Files:**
- Create: `src/entities/ai-snake.js`
- Create: `src/systems/ai.js`
- Create: `src/systems/spawn.js`
- Create: `src/systems/spawn.test.js`
- Modify: `src/main.js`

**Acceptance Criteria:**
- [ ] AI snakes spawn at arena edges, grow, and die by same rules as player
- [ ] Basic AI steers toward food and away from walls
- [ ] Intermediate AI flees snakes larger than itself
- [ ] Aggressive AI hunts smaller snakes
- [ ] Spawn count matches table (3/5/8/10) based on player length
- [ ] `getTargetCount` pure function passes all tests

**Verify:** `npm run test` → spawn tests pass. `npm run dev` → AI snakes visible, moving, competing.

**Steps:**

- [ ] **Step 1: Create `src/systems/spawn.js`**

```js
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
    // Remove dead snakes
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
      alive.push({}); // prevent over-spawn in same tick
    }
  }
}
```

- [ ] **Step 2: Create `src/systems/spawn.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { getTargetCount, getStartingTier } from './spawn.js';

describe('getTargetCount', () => {
  it('returns 3 for length 1',   () => expect(getTargetCount(1)).toBe(3));
  it('returns 3 for length 20',  () => expect(getTargetCount(20)).toBe(3));
  it('returns 5 for length 21',  () => expect(getTargetCount(21)).toBe(5));
  it('returns 5 for length 50',  () => expect(getTargetCount(50)).toBe(5));
  it('returns 8 for length 51',  () => expect(getTargetCount(51)).toBe(8));
  it('returns 8 for length 100', () => expect(getTargetCount(100)).toBe(8));
  it('returns 10 for length 101',() => expect(getTargetCount(101)).toBe(10));
  it('returns 10 for length 999',() => expect(getTargetCount(999)).toBe(10));
});

describe('getStartingTier', () => {
  it('returns 0 (BASIC) for length 10',        () => expect(getStartingTier(10)).toBe(0));
  it('returns 1 (INTERMEDIATE) for length 30', () => expect(getStartingTier(30)).toBe(1));
  it('returns 2 (AGGRESSIVE) for length 80',   () => expect(getStartingTier(80)).toBe(2));
});
```

- [ ] **Step 3: Run spawn tests**

```bash
npm run test
```
Expected: all existing tests + 11 new spawn tests pass.

- [ ] **Step 4: Create `src/systems/ai.js`**

```js
import * as THREE from 'three';

const SCAN_RADIUS = 55;
const WALL_BUFFER = 18;
const TICK_INTERVAL = 0.1;

export const AI_TIER = Object.freeze({ BASIC: 0, INTERMEDIATE: 1, AGGRESSIVE: 2 });

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
    let bestScore = -Infinity, bestDir = ai.direction.clone();

    for (const dir of candidates) {
      const s = this._score(dir, ai, allSnakes, foodSystem, arena);
      if (s > bestScore) { bestScore = s; bestDir = dir; }
    }

    ai.setDirection(bestDir);
  }

  _candidates(dir) {
    const up = new THREE.Vector3(0, 1, 0);
    return [
      dir.clone(),
      dir.clone().applyAxisAngle(up,  Math.PI / 6),
      dir.clone().applyAxisAngle(up, -Math.PI / 6),
      dir.clone().applyAxisAngle(up,  Math.PI / 3),
      dir.clone().applyAxisAngle(up, -Math.PI / 3),
    ];
  }

  _score(dir, ai, allSnakes, foodSystem, arena) {
    const lookahead = ai.headPosition.clone().addScaledVector(dir, 12);
    let score = 0;

    if (arena.isOutOfBounds(lookahead)) return -9999;

    const wallDist = arena.distanceToWall(lookahead);
    if (wallDist < WALL_BUFFER) score -= (WALL_BUFFER - wallDist) * 6;

    const nearFood = foodSystem.nearestPellet(lookahead, SCAN_RADIUS);
    if (nearFood) {
      score += (SCAN_RADIUS - lookahead.distanceTo(nearFood)) * 0.6;
    }

    if (ai.tier === AI_TIER.BASIC) return score;

    // Intermediate+: size-based reactions
    for (const other of allSnakes) {
      if (!other.alive || other === ai) continue;
      const dist = lookahead.distanceTo(other.headPosition);
      if (dist > SCAN_RADIUS) continue;
      const proximity = SCAN_RADIUS - dist;

      if (other.length > ai.length + 5) {
        score -= proximity * 2.5; // flee
      } else if (ai.tier === AI_TIER.AGGRESSIVE && other.length < ai.length - 5) {
        score += proximity * 1.8; // hunt
      }
    }

    // Intermediate+: orb attraction
    const nearOrb = foodSystem.nearestOrb(lookahead, SCAN_RADIUS);
    if (nearOrb) {
      score += (SCAN_RADIUS - lookahead.distanceTo(nearOrb)) * 1.1;
    }

    return score;
  }
}
```

- [ ] **Step 5: Create `src/entities/ai-snake.js`**

```js
import { Snake } from './snake.js';
import { AI_TIER } from '../systems/ai.js';
import * as THREE from 'three';

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
```

- [ ] **Step 6: Update `src/main.js` to wire AI + spawn**

```js
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
  const ai = new AISnake(sceneManager.scene, pos, color, tier);
  aiSnakes.push(ai);
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

  cameraSystem.update(delta, player.headPosition, player.direction, player.length, game.state === STATE.CHAOS);

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

  result.foodEaten.forEach(snake => { snake.grow(2); game.score += 10; });
  result.orbsCollected.forEach(({ snake, growth }) => {
    snake.grow(growth);
    if (snake === player) game.score += growth * 5;
  });
};

game.start();
```

- [ ] **Step 7: Verify**

```bash
npm run dev
```
Expected: Multiple AI snakes spawn at edges, navigate toward food, flee/hunt based on size. They compete with each other and drop orbs when killed.

- [ ] **Step 8: Commit**

```bash
git add src/entities/ai-snake.js src/systems/ai.js src/systems/spawn.js src/systems/spawn.test.js src/main.js
git commit -m "feat: add AI snakes with behavior tiers and spawn scaling"
```

---

### Task 6: Implement Portal & Chaos Mode

**Goal:** Two portal objects in the arena that trigger a 30-second 3D chaos mode when entered, with camera transition, vertical movement enabled, and portals respawning after chaos ends.

**Files:**
- Create: `src/world/portal.js`
- Modify: `src/core/game.js` (chaos transitions already scaffolded — wire portal system)
- Modify: `src/main.js`

**Acceptance Criteria:**
- [ ] Two rotating neon portals visible in arena
- [ ] Player entering portal switches to `STATE.CHAOS`
- [ ] Player can move up/down (W/S or arrow up/down) during chaos
- [ ] Camera pulls back and FOV widens on chaos entry
- [ ] Center-screen placeholder text shows "CHAOS" during chaos (full HUD in Task 7)
- [ ] After 30 seconds, state returns to `PLAYING`, player Y lerps to 0, portals respawn
- [ ] AI snakes that touch portals also enter chaos movement

**Verify:** `npm run dev` → touch portal → chaos mode activates, vertical movement works, ends after 30s.

**Steps:**

- [ ] **Step 1: Create `src/world/portal.js`**

```js
import * as THREE from 'three';

const PORTAL_TRIGGER_RADIUS = 6;

export class PortalSystem {
  constructor(scene, arena) {
    this.scene = scene;
    this.arena = arena;
    this.portals = [];
    this.active = true;
    this._spawnPortal();
    this._spawnPortal();
  }

  _spawnPortal() {
    const geo = new THREE.TorusGeometry(4, 0.8, 8, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xaa00ff,
      emissive: 0xaa00ff,
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    this._repositionPortal(mesh);
    this.scene.add(mesh);
    this.portals.push(mesh);
  }

  _repositionPortal(mesh) {
    const pos = this.arena.randomFloorPosition(20);
    pos.y = 4;
    mesh.position.copy(pos);
    mesh.rotation.set(Math.random() * 0.3, Math.random() * Math.PI * 2, Math.random() * 0.3);
  }

  checkTrigger(headPos) {
    if (!this.active) return null;
    for (const p of this.portals) {
      if (headPos.distanceTo(p.position) < PORTAL_TRIGGER_RADIUS) return p;
    }
    return null;
  }

  respawnAll() {
    this.portals.forEach(p => this._repositionPortal(p));
  }

  setActive(val) {
    this.active = val;
    this.portals.forEach(p => { p.visible = val; });
  }

  update(delta) {
    this.portals.forEach(p => {
      p.rotation.z += delta * 2.2;
      p.rotation.y += delta * 0.6;
    });
  }
}
```

- [ ] **Step 2: Update `src/main.js` to wire portals and chaos**

Replace `src/main.js` fully:

```js
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
import * as THREE from 'three';

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

// Chaos banner (temp — replaced by HUD in Task 7)
const chaosBanner = document.createElement('div');
chaosBanner.style.cssText = `
  position: fixed; top: 50%; left: 50%; transform: translate(-50%,-60%);
  color: #ff00ff; font-family: monospace; font-size: 42px; font-weight: bold;
  text-shadow: 0 0 20px #ff00ff; display: none; pointer-events: none; z-index: 20;
`;
document.body.appendChild(chaosBanner);

function addAI(pos, color, tier) {
  aiSnakes.push(new AISnake(sceneManager.scene, pos, color, tier));
}
function removeAI(snake) {
  const idx = aiSnakes.indexOf(snake);
  if (idx !== -1) aiSnakes.splice(idx, 1);
}

game.update = function(delta) {
  if (game.state !== STATE.PLAYING && game.state !== STATE.CHAOS) return;

  // Chaos timer
  if (game.state === STATE.CHAOS) {
    game.chaosTimer -= delta;
    chaosBanner.textContent = 'CHAOS ' + Math.ceil(game.chaosTimer) + 's';
    if (game.chaosTimer <= 0) {
      game._endChaos();
      chaosBanner.style.display = 'none';
      // Lerp player back to floor
      player._headPos.y = 0;
      player.direction.y = 0;
      player.direction.normalize();
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
      chaosBanner.style.display = 'none';
      console.log('GAME OVER — Score:', game.score, 'Kills:', game.kills);
    } else {
      game.kills++;
      game.score += 100;
    }
  });

  result.foodEaten.forEach(snake => { snake.grow(2); game.score += 10; });
  result.orbsCollected.forEach(({ snake, growth }) => {
    snake.grow(growth);
    if (snake === player) game.score += growth * 5;
  });

  result.portalsHit.forEach(snake => {
    if (game.state !== STATE.CHAOS) {
      game.enterChaos();
      chaosBanner.style.display = 'block';
      // Enable vertical movement for all current snakes
      allSnakes.forEach(s => { s.canMoveVertical = true; });
    }
  });
};

game.start();
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```
Expected:
- Two rotating purple portals visible in arena
- Walking into portal → "CHAOS Xs" appears center screen, player can move vertically with W/S
- Camera pulls far back during chaos
- After 30 seconds: chaos ends, portals respawn at new positions, camera returns to normal follow

- [ ] **Step 4: Commit**

```bash
git add src/world/portal.js src/main.js
git commit -m "feat: add portals and chaos mode with 3D vertical movement"
```

---

### Task 7: Implement HUD & Game Over Screen

**Goal:** HTML overlay HUD with live stats (length/score/kills), 2D canvas minimap, chaos mode countdown, and a death screen with final stats and a restart button.

**Files:**
- Create: `src/ui/hud.js`
- Create: `src/ui/gameover.js`
- Modify: `src/main.js` (replace temp chaos banner, wire HUD + GameOver)

**Acceptance Criteria:**
- [ ] Top-left HUD shows live length, score, kill count updating in real time
- [ ] Top-right minimap shows dots for all living snakes (player in blue, AI in their colors)
- [ ] Chaos countdown shows center-screen during chaos, hidden otherwise
- [ ] Death triggers a styled overlay with final stats
- [ ] Restart button reloads the game cleanly
- [ ] No `pointer-events` on HUD during gameplay (clicking through to canvas works)

**Verify:** `npm run dev` → HUD visible, minimap updates, death screen appears and restart works.

**Steps:**

- [ ] **Step 1: Create `src/ui/hud.js`**

```js
export class HUD {
  constructor(el) {
    el.innerHTML = `
      <div id="hud-stats" style="
        position:absolute; top:16px; left:16px;
        color:#fff; font-family:'Courier New',monospace; font-size:15px; line-height:1.8;
        text-shadow:0 0 10px #00aaff; user-select:none;
      ">
        <div>LENGTH &nbsp;<span id="h-len">6</span></div>
        <div>SCORE &nbsp;&nbsp;<span id="h-score">0</span></div>
        <div>KILLS &nbsp;&nbsp;<span id="h-kills">0</span></div>
      </div>

      <canvas id="minimap" width="160" height="160" style="
        position:absolute; top:16px; right:16px;
        border:1px solid #224466; background:rgba(0,0,0,0.6);
      "></canvas>

      <div id="chaos-hud" style="
        position:absolute; top:42%; left:50%; transform:translateX(-50%);
        color:#ff00ff; font-family:'Courier New',monospace; font-size:44px; font-weight:bold;
        text-shadow:0 0 24px #ff00ff; display:none; user-select:none; text-align:center;
      ">CHAOS<br><span id="chaos-time"></span></div>
    `;

    this._len   = document.getElementById('h-len');
    this._score = document.getElementById('h-score');
    this._kills = document.getElementById('h-kills');
    this._chaos = document.getElementById('chaos-hud');
    this._chaosTime = document.getElementById('chaos-time');
    this._mapCtx = document.getElementById('minimap').getContext('2d');
  }

  update({ length, score, kills, chaosTimer, snakes, arena }) {
    this._len.textContent   = length;
    this._score.textContent = score;
    this._kills.textContent = kills;

    if (chaosTimer > 0) {
      this._chaos.style.display = 'block';
      this._chaosTime.textContent = Math.ceil(chaosTimer) + 's';
    } else {
      this._chaos.style.display = 'none';
    }

    this._drawMinimap(snakes, arena);
  }

  _drawMinimap(snakes, arena) {
    const ctx = this._mapCtx;
    const W = 160, H = 160;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,5,15,0.85)';
    ctx.fillRect(0, 0, W, H);

    // Arena border
    ctx.strokeStyle = '#224466';
    ctx.strokeRect(2, 2, W - 4, H - 4);

    const sx = W / (arena.halfW * 2);
    const sz = H / (arena.halfD * 2);

    for (const snake of snakes) {
      if (!snake.alive) continue;
      const hex = '#' + snake.color.toString(16).padStart(6, '0');
      ctx.fillStyle = hex;

      // Draw trail dots (every few trail points)
      const step = Math.max(1, Math.floor(snake.trail.length / 8));
      for (let i = 0; i < snake.trail.length; i += step) {
        const pt = snake.trail[i];
        const px = (pt.x + arena.halfW) * sx;
        const pz = (pt.z + arena.halfD) * sz;
        ctx.fillRect(px - 1, pz - 1, 2, 2);
      }

      // Head dot (larger)
      const h = snake.headPosition;
      const hx = (h.x + arena.halfW) * sx;
      const hz = (h.z + arena.halfD) * sz;
      ctx.beginPath();
      ctx.arc(hx, hz, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
```

- [ ] **Step 2: Create `src/ui/gameover.js`**

```js
export class GameOver {
  constructor(el, onRestart) {
    this._el = el;
    this._onRestart = onRestart;
    this._overlay = null;
  }

  show(length, score, kills) {
    if (this._overlay) return;

    const div = document.createElement('div');
    div.style.cssText = `
      position:absolute; top:0; left:0; width:100%; height:100%;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      background:rgba(0,0,0,0.78); color:#fff;
      font-family:'Courier New',monospace; pointer-events:all;
      z-index:50;
    `;
    div.innerHTML = `
      <div style="font-size:72px;color:#ff3333;text-shadow:0 0 30px #ff3333;margin-bottom:28px;letter-spacing:6px;">
        DEAD
      </div>
      <div style="font-size:22px;margin-bottom:10px;color:#aaa;">LENGTH &nbsp; <span style="color:#fff">${length}</span></div>
      <div style="font-size:22px;margin-bottom:10px;color:#aaa;">SCORE &nbsp;&nbsp; <span style="color:#fff">${score}</span></div>
      <div style="font-size:22px;margin-bottom:36px;color:#aaa;">KILLS &nbsp;&nbsp; <span style="color:#fff">${kills}</span></div>
      <button id="btn-restart" style="
        font-family:'Courier New',monospace; font-size:22px;
        padding:14px 40px; background:#00aaff; color:#000;
        border:none; cursor:pointer; letter-spacing:3px; text-transform:uppercase;
      ">RESTART</button>
    `;

    this._el.appendChild(div);
    this._overlay = div;

    document.getElementById('btn-restart').addEventListener('click', () => {
      this.hide();
      this._onRestart();
    });
  }

  hide() {
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
  }
}
```

- [ ] **Step 3: Replace `src/main.js` with final wired version**

```js
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
import { HUD } from './ui/hud.js';
import { GameOver } from './ui/gameover.js';

const container = document.getElementById('canvas-container');
const hudEl     = document.getElementById('hud');

const sceneManager    = new SceneManager(container);
const input           = new InputHandler();
const cameraSystem    = new CameraSystem(sceneManager.camera);
const game            = new Game(sceneManager, input, cameraSystem);
const arena           = new Arena(sceneManager.scene);
const foodSystem      = new FoodSystem(sceneManager.scene, arena);
const portalSystem    = new PortalSystem(sceneManager.scene, arena);
const player          = new Player(sceneManager.scene, input);
const collisionSystem = new CollisionSystem(arena);
const aiSystem        = new AISystem();
const spawnSystem     = new SpawnSystem(sceneManager.scene, arena);
const hud             = new HUD(hudEl);
const gameOver        = new GameOver(hudEl, () => window.location.reload());

game.player       = player;
game.portalSystem = portalSystem;
game.gameOver     = gameOver;

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

  if (game.state === STATE.CHAOS) {
    game.chaosTimer -= delta;
    if (game.chaosTimer <= 0) {
      game._endChaos();
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
      gameOver.show(player.length, game.score, game.kills);
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

  result.portalsHit.forEach(() => {
    if (game.state !== STATE.CHAOS) {
      game.enterChaos();
      allSnakes.forEach(s => { s.canMoveVertical = true; });
    }
  });

  hud.update({
    length: player.length,
    score: game.score,
    kills: game.kills,
    chaosTimer: game.state === STATE.CHAOS ? game.chaosTimer : 0,
    snakes: allSnakes,
    arena,
  });
};

game.start();
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Test the following:
- Top-left shows LENGTH / SCORE / KILLS updating in real time
- Top-right minimap shows colored dots for player and AI snakes
- Touch a portal → "CHAOS Xs" countdown appears center screen
- Hit a wall → death overlay appears with stats
- Click RESTART → game reloads cleanly

- [ ] **Step 5: Run all tests one final time**

```bash
npm run test
```
Expected: all tests pass (arena bounds × 5, wall distance × 3, collision × 5, spawn × 11 = 24 total).

- [ ] **Step 6: Final commit**

```bash
git add src/ui/ src/main.js
git commit -m "feat: add HUD, minimap, chaos timer, and game over screen — game complete"
```
