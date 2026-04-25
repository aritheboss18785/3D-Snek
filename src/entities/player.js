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
