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
      font-family:'Courier New',monospace; pointer-events:all; z-index:50;
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
