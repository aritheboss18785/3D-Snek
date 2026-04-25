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

    this._len       = document.getElementById('h-len');
    this._score     = document.getElementById('h-score');
    this._kills     = document.getElementById('h-kills');
    this._chaos     = document.getElementById('chaos-hud');
    this._chaosTime = document.getElementById('chaos-time');
    this._mapCtx    = document.getElementById('minimap').getContext('2d');
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

    ctx.strokeStyle = '#224466';
    ctx.strokeRect(2, 2, W - 4, H - 4);

    const sx = W / (arena.halfW * 2);
    const sz = H / (arena.halfD * 2);

    for (const snake of snakes) {
      if (!snake.alive) continue;
      const hex = '#' + snake.color.toString(16).padStart(6, '0');
      ctx.fillStyle = hex;

      // Draw trail dots
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
