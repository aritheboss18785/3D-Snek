import * as THREE from 'three';

const NORMAL_BEHIND = -28;
const NORMAL_ABOVE = 14;
const CHAOS_BEHIND = -80;
const CHAOS_ABOVE = 60;
const NORMAL_FOV = 70;
const CHAOS_FOV = 90;
const LERP_SPEED = 8;
const FOV_LERP_SPEED = 5;

export class CameraSystem {
  constructor(camera) {
    this.camera = camera;
    this._lookAtTarget = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);
  }

  update(delta, headPos, direction, snakeLength, isChaos) {
    const fwd = direction.clone().normalize();
    const up = this._up;

    const behind = isChaos ? CHAOS_BEHIND : NORMAL_BEHIND - snakeLength * 0.1;
    const above  = isChaos ? CHAOS_ABOVE  : NORMAL_ABOVE;

    const targetPos = headPos.clone()
      .addScaledVector(fwd, behind)
      .addScaledVector(up, above);

    this.camera.position.lerp(targetPos, Math.min(LERP_SPEED * delta, 1));

    const lookAt = headPos.clone().addScaledVector(fwd, 12);
    this._lookAtTarget.lerp(lookAt, Math.min(LERP_SPEED * delta, 1));
    this.camera.lookAt(this._lookAtTarget);

    const targetFov = isChaos ? CHAOS_FOV : NORMAL_FOV;
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(FOV_LERP_SPEED * delta, 1);
    this.camera.updateProjectionMatrix();
  }
}
