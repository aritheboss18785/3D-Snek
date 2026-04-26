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
    this._groundPenaltyAccum = 0;

    // Set by main.js after construction
    this.player = null;
    this.aiSnakes = [];
    this.arena = null;
    this.foodSystem = null;
    this.portalSystem = null;
    this.collisionSystem = null;
    this.spawnSystem = null;
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
    try {
      this.update(delta);
      this.sceneManager.render();
    } catch (e) {
      console.error('[Game loop error]', e);
    }
    if (this.state !== STATE.DEAD) {
      this._rafId = requestAnimationFrame(t => this._loop(t));
    }
  }

  update(delta) {
    if (this.state !== STATE.PLAYING && this.state !== STATE.CHAOS) return;
    // Subclasses/main.js override this
  }

  enterChaos() {
    if (this.state === STATE.CHAOS) return;
    this.state = STATE.CHAOS;
    this.chaosTimer = 30;
    this._groundPenaltyAccum = 0;
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

  restart() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    window.location.reload();
  }
}
