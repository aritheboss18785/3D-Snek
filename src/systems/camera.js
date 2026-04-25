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
