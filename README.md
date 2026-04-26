# 3D Snake

A browser-based snake game built with Three.js. You grow by eating food, hunt down AI opponents, and occasionally get thrown into a chaotic 3D free for all when you fly through a portal.

## Gameplay

Move around the arena eating pellets and orbs to grow longer. Running into another snake's body kills it. Their remains drop as collectible orbs worth bonus points. (What's Slither.io?) AI snakes spawn and grow over time, and as you get bigger the competition gets tougher.

**Chaos Mode**: touch one of the glowing purple portals and everything goes 3D for 30 seconds. All snakes can move vertically. Sitting on the ground costs you length, so get airborne. When the timer runs out, everyone returns to the floor and the portals reposition.

## Scoring

| Action | Points |
|---|---|
| Eat a food pellet | +10 |
| Collect a death orb | +5 per unit |
| Kill an AI snake | +100 |

## Controls

| Key | Action |
|---|---|
| `W` / `↑` | Move forward / up (chaos) |
| `S` / `↓` | Move backward / down (chaos) |
| `A` / `←` | Turn left |
| `D` / `→` | Turn right |

## Running Locally

```bash
npm install
npm run dev
```

Cmd+click (Mac) or Ctrl+click (Windows) on the link shown in your terminal. (It should look like http://localhost:517x/)

## Tech

- [Three.js](https://threejs.org/) for 3D rendering
- [Vite](https://vite.dev/) for dev server and bundling
- [Vitest](https://vitest.dev/) for unit tests (`npm test`)
