# 3D Snake Game — Design Spec
_Date: 2026-04-25_

## Overview

A browser-based 3D snake game combining classic Snake and Slither.io mechanics. Solo player vs adaptive AI-controlled opponent snakes. Built with Vite + Three.js.

---

## Core Rules

- **Head hits any other snake's body** → that snake dies (player or AI)
- **Head hits own body** → no collision (self-collision disabled, enables circling strategy)
- **Head hits arena wall** → death
- **Killing** is achieved by forcing an enemy's head into your body — circling is a valid strategy
- **Growing** happens by eating food pellets or collecting orbs dropped by dead snakes

---

## Architecture & Module Structure

```
src/
  main.js                  — entry point, bootstraps everything
  core/
    game.js                — game loop, state machine (menu/playing/chaos/dead)
    scene.js               — Three.js renderer, lighting setup
    input.js               — keyboard input, normalized direction vectors
  entities/
    snake.js               — base Snake class (segments, movement, growth)
    player.js              — extends Snake, input-driven
    ai-snake.js            — extends Snake, behavior-driven
  world/
    arena.js               — bounded box, wall collision detection
    food.js                — pellet spawning, orb drops on death
    portal.js              — portal objects, chaos mode trigger
  systems/
    ai.js                  — behavior tiers, adaptive difficulty
    collision.js           — head-vs-body, head-vs-wall detection
    camera.js              — third-person follow, chaos mode transition
    spawn.js               — AI count scaling, food density
  ui/
    hud.js                 — score, length, kills, minimap, chaos timer
    gameover.js            — death screen, stats, restart
```

**State machine:** `menu → playing ↔ chaos → dead → menu`

---

## Snake System

Each snake is a chain of segment meshes (cylinders/spheres), positions stored as an array. Movement advances the head and drops the tail each tick.

**Snake class API:**
- `update(delta)` — advance head, drop tail
- `grow(amount)` — queue N tail extensions
- `die()` — remove from scene, spawn orbs at each segment position
- `headPosition` — used by collision system each tick

Self-collision is permanently disabled. The `canMoveVertical` flag is set during chaos mode to enable up/down input.

---

## Arena & World

- **Arena:** Wireframe box, 200×200×80 units. Wide and flat for 2D-plane gameplay; the 80-unit vertical space gives meaningful room during chaos mode 3D movement while keeping the floor-plane feel dominant in normal mode.
- **Floor:** Subtle glowing grid texture for depth perception.
- **Food pellets:** Randomly distributed, constant density (~1 per 400 sq units), respawn on collection.
- **Orb drops:** Each segment of a dead snake spawns a pulsing orb, drifts upward, despawns after 15 seconds if uncollected. Color matches the dead snake.
- **Portals:** 2 always active, rotating neon ring with particle effect. Respawn at new positions after each chaos session.

---

## AI System

Three behavior tiers assigned by snake length:

| Tier | Length | Behavior |
|------|--------|----------|
| Basic | Small | Steer toward nearest food, avoid walls with lookahead buffer |
| Intermediate | Medium | Target food, flee larger snakes, 3-step collision lookahead |
| Aggressive | Large | Hunt smaller snakes, attempt circling, contest orb drops |

**Decision loop** runs every 100ms (not every frame), decoupled from render rate:
1. Scan nearby snakes and food within a radius
2. Score each possible direction using local steering
3. Pick highest-scoring safe direction

No global pathfinding — purely local steering for performance at scale.

**Adaptive difficulty:** As player length/score increases, newly spawned AI snakes start at higher tiers. Aggressive AI lookahead distance tightens as player score rises. Caps at a maximum to keep the game winnable.

**Inter-AI competition:** AI snakes follow identical rules to the player — they target each other, steal orbs, and die on wall/body collision. No special treatment.

---

## Spawn Scaling

| Player Length | AI Snake Count |
|--------------|----------------|
| 1–20 | 3 |
| 21–50 | 5 |
| 51–100 | 8 |
| 100+ | 10 (cap) |

New AI snakes spawn at arena edges, never near the player.

---

## Portal & Chaos Mode

- Entering a portal switches game state to `chaos`
- Player gains vertical movement (`canMoveVertical = true`)
- Camera pulls back and widens FOV over ~1 second (lerp)
- 30-second chaos timer displayed center-screen in HUD
- On expiry: snake Y lerps back to 0, vertical movement disabled, camera returns to follow mode
- Portals respawn at new random positions after chaos ends
- AI snakes can also enter portals

---

## Camera

**Normal mode:**
- Positioned behind and above snake head, looking forward along movement direction
- Smooth `lerp` interpolation each frame — no snapping
- Distance scales slightly with snake length

**Chaos mode:**
- Pulls back significantly, rises for full 3D overview
- FOV widens slightly
- Smooth transition (~1 second lerp) in and out

---

## Visual Style

- **Background:** Deep navy / space black
- **Floor:** Dark with glowing grid lines
- **Player snake:** Electric blue with emissive glow
- **AI snakes:** Varied colors; glow intensity reflects tier (dim = basic, bright = aggressive)
- **Food pellets:** Small glowing white/yellow spheres
- **Orbs:** Larger, pulsing, color matches dead snake
- **Portals:** Swirling neon ring with particle trail

---

## HUD (HTML overlay)

- **Top-left:** Length, score, kill count (live updates)
- **Top-right:** 2D canvas minimap showing all snake positions
- **Center:** Chaos mode countdown timer (chaos state only)
- **Death screen:** Final length, score, kills — restart button resets full game state

---

## Out of Scope (v1)

- Power-ups (speed boost, ghost mode, magnet)
- Multiplayer
- Leaderboards
- Sound/music (nice to have but not required)
