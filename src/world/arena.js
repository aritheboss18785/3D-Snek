import * as THREE from 'three';

export const ARENA_W = 200;
export const ARENA_D = 200;
export const ARENA_H = 80;

export function isOutOfBounds(pos, halfW, halfD, ceilH) {
  return (
    pos.x < -halfW || pos.x > halfW ||
    pos.z < -halfD || pos.z > halfD ||
    pos.y < 0 || pos.y > ceilH
  );
}

export function distanceToWall(pos, halfW, halfD, ceilH) {
  return Math.min(
    pos.x + halfW, halfW - pos.x,
    pos.z + halfD, halfD - pos.z,
    pos.y, ceilH - pos.y
  );
}

export class Arena {
  constructor(scene) {
    this.halfW = ARENA_W / 2;
    this.halfD = ARENA_D / 2;
    this.ceilH = ARENA_H;
    this._build(scene);
  }

  _build(scene) {
    // Wireframe box
    const boxGeo = new THREE.BoxGeometry(ARENA_W, ARENA_H, ARENA_D);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x224466, transparent: true, opacity: 0.6 });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    wireframe.position.set(0, ARENA_H / 2, 0);
    scene.add(wireframe);

    // Grid floor
    const grid = new THREE.GridHelper(ARENA_W, 40, 0x113355, 0x0a1a2a);
    grid.position.set(0, 0.01, 0);
    scene.add(grid);

    // Solid floor
    const floorGeo = new THREE.PlaneGeometry(ARENA_W, ARENA_D);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x050f1a, roughness: 1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
  }

  isOutOfBounds(pos) {
    return isOutOfBounds(pos, this.halfW, this.halfD, this.ceilH);
  }

  distanceToWall(pos) {
    return distanceToWall(pos, this.halfW, this.halfD, this.ceilH);
  }

  randomFloorPosition(margin = 10) {
    return new THREE.Vector3(
      (Math.random() - 0.5) * (ARENA_W - margin * 2),
      0,
      (Math.random() - 0.5) * (ARENA_D - margin * 2)
    );
  }

  randomEdgePosition() {
    const edge = Math.floor(Math.random() * 4);
    const t = (Math.random() - 0.5) * (ARENA_W - 20);
    const m = 5;
    switch (edge) {
      case 0: return new THREE.Vector3(-this.halfW + m, 0, t);
      case 1: return new THREE.Vector3( this.halfW - m, 0, t);
      case 2: return new THREE.Vector3(t, 0, -this.halfD + m);
      default: return new THREE.Vector3(t, 0,  this.halfD - m);
    }
  }
}
