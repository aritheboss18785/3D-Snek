export class InputHandler {
  constructor() {
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;

    this._onKeyDown = e => this._onKey(e.code, true);
    this._onKeyUp = e => this._onKey(e.code, false);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
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
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
