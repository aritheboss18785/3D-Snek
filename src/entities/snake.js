import * as THREE from 'three';

const SEGMENT_SPACING = 2.8;
const HEAD_RADIUS = 1.4;
const BODY_RADIUS = 1.1;

export class Snake {
  constructor(scene, startPos, color) {
    this.scene = scene;
    this.color = color;
    this.alive = true;
    this.canMoveVertical = false;

    this._headPos = startPos.clone();
    this.direction = new THREE.Vector3(1, 0, 0);
    this.speed = 22;
    this.turnSpeed = 2.4;

    this.trail = [startPos.clone()]; // trail[0] = most recent position
    this._distAccum = 0;
    this.targetLength = 6;
    this.growthQueue = 0;
    this.segments = [];

    for (let i = 0; i < this.targetLength; i++) this._addSegment(i === 0);
  }

  get headPosition() { return this._headPos; }
  get length() { return this.targetLength; }

  _addSegment(isHead = false) {
    const r = isHead ? HEAD_RADIUS : BODY_RADIUS;
    const geo = new THREE.SphereGeometry(r, 10, 8);
    const mat = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: isHead ? 0.6 : 0.25,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const last = this.segments.length > 0
      ? this.segments[this.segments.length - 1].position.clone()
      : this._headPos.clone();
    mesh.position.copy(last);
    this.scene.add(mesh);
    this.segments.push(mesh);
  }

  steerHorizontal(sign, delta) {
    const axis = new THREE.Vector3(0, 1, 0);
    this.direction.applyAxisAngle(axis, sign * this.turnSpeed * delta);
    this.direction.normalize();
  }

  steerVertical(sign, delta) {
    const right = new THREE.Vector3()
      .crossVectors(this.direction, new THREE.Vector3(0, 1, 0))
      .normalize();
    this.direction.applyAxisAngle(right, sign * this.turnSpeed * delta);
    this.direction.normalize();
  }

  setDirection(dir) {
    this.direction.copy(dir).normalize();
  }

  update(delta) {
    const moveDist = this.speed * delta;
    this._headPos.addScaledVector(this.direction, moveDist);
    this._distAccum += moveDist;

    if (this._distAccum >= SEGMENT_SPACING) {
      this._distAccum -= SEGMENT_SPACING;
      this.trail.unshift(this._headPos.clone());

      if (this.growthQueue > 0) {
        this.growthQueue--;
      } else {
        const max = this.targetLength + 4;
        if (this.trail.length > max) this.trail.length = max;
      }

      while (this.segments.length < this.targetLength) {
        this._addSegment(false);
      }
    } else {
      // Update front of trail to current head position each frame
      this.trail[0] = this._headPos.clone();
    }

    // Sync segment mesh positions
    this.segments[0].position.copy(this._headPos);
    for (let i = 1; i < this.segments.length; i++) {
      const idx = Math.min(i, this.trail.length - 1);
      this.segments[i].position.copy(this.trail[idx]);
    }
  }

  grow(amount) {
    this.targetLength += amount;
    this.growthQueue += amount;
  }

  die(onDie) {
    this.alive = false;
    const positions = this.trail.slice();
    this.segments.forEach(s => {
      this.scene.remove(s);
      s.geometry.dispose();
      s.material.dispose();
    });
    this.segments = [];
    if (onDie) onDie(positions, this.color);
  }
}
