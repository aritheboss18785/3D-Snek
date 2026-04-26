# Chaos Mode & Death Improvements — Design Spec

**Date:** 2026-04-26  
**Status:** Approved

---

## Problems Being Solved

1. Dead snake body segments remain visible after death (re-created on the next frame).
2. Chaos mode has no meaningful incentive to leave the ground.
3. AI snakes cannot actually use 3D movement during chaos.
4. 3D→2D transition is an instant snap (jarring).
5. Chaos HUD label blocks center of screen.

---

## Fix 1 — Dead Body Persistence

**Root cause:** Dead AI snakes stay in `aiSnakes` for one frame after dying (spawn system removes them at the start of the *next* frame's update). Their `update()` is called, finds `segments.length === 0` and `targetLength > 0`, and re-creates all body segments at the old trail positions.

**Fix:** Add `if (!this.alive) return;` at the top of `Snake.update()`. Dead snakes skip all movement and mesh sync.

---

## Fix 2 — Chaos Incentive (A + B)

### A — Air Food
- When chaos starts: spawn 25 glowing white orbs at random positions throughout the full 3D volume (x/z: arena floor range, y: 10–60).
- Visually distinct: white (`0xffffff`) with high emissive intensity, subtle hovering animation.
- Worth **5 growth** each (vs 3 for ground orbs). Checked via 3D distance.
- Cleared from scene when chaos ends.
- Collection integrated into existing `checkOrbCollection()` so collision system needs no changes.

### B — Ground Penalty
- Every 0.5 s during chaos, any living snake with `headPosition.y < 3` loses 1 length (min 3).
- Implemented via `snake.shrink(amount)` — new method that decreases `targetLength` and removes tail segments from scene.
- Timer (`_groundPenaltyAccum`) tracked in `Game`, reset when chaos starts.

---

## Fix 3 — AI 3D Movement

- `AISystem._candidates()` now accepts the snake instance.
- When `snake.canMoveVertical`, generate 7 candidates instead of 5: the existing 5 horizontal ± 2 vertical (±36° around the right axis).
- `AISystem._score()` checks `foodSystem.nearestChaosOrb()` — new method — and scores it at **2×** the orb weight to actively seek air food.

---

## Fix 4 — Smooth Descent

Inside `Snake.update()`, when `canMoveVertical === false`:
- **Gravity:** `_headPos.y` decreases at 30 units/s, clamped to 0.
- **Level-out:** `direction.y` decays by factor `(1 - min(6·Δt, 1))` per frame until `|direction.y| < 0.001`, then zeroed. Direction is renormalized.

The instant y-snap in `main.js` (`player._headPos.y = 0; direction.y = 0`) is removed. Works identically for player and AI snakes.

---

## Fix 5 — Chaos HUD

Move chaos label from `top: 42%; font-size: 44px` to a compact pill at `top: 12px; font-size: 20px`, inline "CHAOS — Xs" format with semi-transparent background. Does not block gameplay.

---

## Files Changed

| File | Change |
|------|--------|
| `src/entities/snake.js` | `alive` guard, smooth descent logic, `shrink()` |
| `src/world/food.js` | `chaosOrbs`, `spawnChaosFood`, `clearChaosFood`, chaos collection in `checkOrbCollection`, `nearestChaosOrb`, hover animation |
| `src/systems/ai.js` | 7-candidate generation when `canMoveVertical`, chaos orb scoring |
| `src/core/game.js` | `_groundPenaltyAccum` field, reset in `enterChaos` |
| `src/main.js` | Ground penalty timer, chaos food lifecycle, remove y-snap |
| `src/ui/hud.js` | Reposition chaos label |
