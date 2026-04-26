import * as THREE from 'three';

const FOOD_COUNT = 100;
const FOOD_GEO = new THREE.SphereGeometry(0.8, 8, 6);
const CHAOS_ORB_GEO = new THREE.SphereGeometry(1.8, 8, 8);

export class FoodSystem {
  constructor(scene, arena) {
    this.scene = scene;
    this.arena = arena;
    this.pellets = [];
    this.orbs = [];
    this.chaosOrbs = [];

    for (let i = 0; i < FOOD_COUNT; i++) this._spawnPellet();
  }

  _spawnPellet() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffaa,
      emissive: 0xffffaa,
      emissiveIntensity: 0.9,
    });
    const mesh = new THREE.Mesh(FOOD_GEO, mat);
    mesh.position.copy(this.arena.randomFloorPosition());
    mesh.position.y = 0.8;
    this.scene.add(mesh);
    this.pellets.push(mesh);
  }

  spawnChaosFood(arena, count = 25) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xeeffff,
        emissiveIntensity: 2.0,
      });
      const mesh = new THREE.Mesh(CHAOS_ORB_GEO, mat);
      const pos = arena.randomFloorPosition(20);
      pos.y = 10 + Math.random() * 50;
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.chaosOrbs.push({ mesh, baseY: pos.y, phase: Math.random() * Math.PI * 2 });
    }
  }

  clearChaosFood() {
    this.chaosOrbs.forEach(orb => {
      this.scene.remove(orb.mesh);
      orb.mesh.geometry.dispose();
      orb.mesh.material.dispose();
    });
    this.chaosOrbs = [];
  }

  checkCollection(headPos, radius) {
    for (const p of this.pellets) {
      const dx = headPos.x - p.position.x;
      const dz = headPos.z - p.position.z;
      if (dx * dx + dz * dz < radius * radius) {
        p.position.copy(this.arena.randomFloorPosition());
        p.position.y = 0.8;
        return true;
      }
    }
    return false;
  }

  checkOrbCollection(headPos, radius) {
    const r2 = radius * radius;
    let growth = 0;

    this.orbs = this.orbs.filter(orb => {
      const dx = headPos.x - orb.mesh.position.x;
      const dz = headPos.z - orb.mesh.position.z;
      if (dx * dx + dz * dz < r2) {
        this.scene.remove(orb.mesh);
        orb.mesh.geometry.dispose();
        orb.mesh.material.dispose();
        growth += 3;
        return false;
      }
      return true;
    });

    this.chaosOrbs = this.chaosOrbs.filter(orb => {
      if (headPos.distanceToSquared(orb.mesh.position) < r2) {
        this.scene.remove(orb.mesh);
        orb.mesh.geometry.dispose();
        orb.mesh.material.dispose();
        growth += 5;
        return false;
      }
      return true;
    });

    return growth;
  }

  spawnOrbs(trailPositions, color) {
    const step = Math.max(1, Math.floor(trailPositions.length / 20));
    for (let i = 0; i < trailPositions.length; i += step) {
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.2,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), mat);
      mesh.position.copy(trailPositions[i]);
      mesh.position.y = Math.max(mesh.position.y, 1.5);
      this.scene.add(mesh);
      this.orbs.push({ mesh, timer: 15, phase: Math.random() * Math.PI * 2 });
    }
  }

  nearestPellet(pos, radius) {
    let best = null, bestDist = radius * radius;
    for (const p of this.pellets) {
      const dx = pos.x - p.position.x, dz = pos.z - p.position.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestDist) { bestDist = d2; best = p.position; }
    }
    return best;
  }

  nearestOrb(pos, radius) {
    let best = null, bestDist = radius * radius;
    for (const orb of this.orbs) {
      const d2 = pos.distanceToSquared(orb.mesh.position);
      if (d2 < bestDist) { bestDist = d2; best = orb.mesh.position; }
    }
    return best;
  }

  nearestChaosOrb(pos, radius) {
    let best = null, bestDist = radius * radius;
    for (const orb of this.chaosOrbs) {
      const d2 = pos.distanceToSquared(orb.mesh.position);
      if (d2 < bestDist) { bestDist = d2; best = orb.mesh.position; }
    }
    return best;
  }

  update(delta) {
    this.orbs = this.orbs.filter(orb => {
      orb.timer -= delta;
      if (orb.timer <= 0) {
        this.scene.remove(orb.mesh);
        orb.mesh.geometry.dispose();
        orb.mesh.material.dispose();
        return false;
      }
      orb.phase += delta * 3;
      orb.mesh.material.emissiveIntensity = 0.6 + 0.6 * Math.sin(orb.phase);
      orb.mesh.position.y += delta * 0.4;
      return true;
    });

    this.chaosOrbs.forEach(orb => {
      orb.phase += delta * 1.8;
      orb.mesh.material.emissiveIntensity = 1.5 + 0.5 * Math.sin(orb.phase);
      orb.mesh.position.y = orb.baseY + Math.sin(orb.phase * 0.7) * 1.2;
    });
  }

  dispose() {
    this.pellets.forEach(p => {
      this.scene.remove(p);
      p.material.dispose();
    });
    FOOD_GEO.dispose();
    CHAOS_ORB_GEO.dispose();
    this.pellets = [];
    this.orbs.forEach(orb => {
      this.scene.remove(orb.mesh);
      orb.mesh.geometry.dispose();
      orb.mesh.material.dispose();
    });
    this.orbs = [];
    this.clearChaosFood();
  }
}
