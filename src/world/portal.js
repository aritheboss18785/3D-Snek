import * as THREE from 'three';

const PORTAL_TRIGGER_RADIUS = 6;

export class PortalSystem {
  constructor(scene, arena) {
    this.scene = scene;
    this.arena = arena;
    this.portals = [];
    this.active = true;
    this._spawnPortal();
    this._spawnPortal();
  }

  _spawnPortal() {
    const geo = new THREE.TorusGeometry(4, 0.8, 8, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xaa00ff,
      emissive: 0xaa00ff,
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    this._repositionPortal(mesh);
    this.scene.add(mesh);
    this.portals.push(mesh);
  }

  _repositionPortal(mesh) {
    const pos = this.arena.randomFloorPosition(20);
    pos.y = 4;
    mesh.position.copy(pos);
    mesh.rotation.set(
      Math.random() * 0.3,
      Math.random() * Math.PI * 2,
      Math.random() * 0.3
    );
  }

  checkTrigger(headPos) {
    if (!this.active) return null;
    for (const p of this.portals) {
      if (headPos.distanceTo(p.position) < PORTAL_TRIGGER_RADIUS) return p;
    }
    return null;
  }

  respawnAll() {
    this.portals.forEach(p => this._repositionPortal(p));
  }

  setActive(val) {
    this.active = val;
    this.portals.forEach(p => { p.visible = val; });
  }

  update(delta) {
    this.portals.forEach(p => {
      p.rotation.z += delta * 2.2;
      p.rotation.y += delta * 0.6;
    });
  }
}
