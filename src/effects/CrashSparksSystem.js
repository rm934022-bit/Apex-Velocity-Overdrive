/**
 * Apex Velocity: Overdrive
 * Crash Sparks & Debris System
 * Emits glowing orange/yellow spark particles that burst and shower outward on wall/car impacts
 */

import * as THREE from 'three';

export class CrashSparksSystem {
  constructor(scene, maxSparks = 80) {
    this.scene = scene;
    this.maxSparks = maxSparks;
    this.sparks = [];
    this.nextIndex = 0;

    // Glowing spark texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.2, 'rgba(255, 200, 50, 0.95)');
    grad.addColorStop(0.6, 'rgba(255, 100, 10, 0.6)');
    grad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    this.material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const geo = new THREE.PlaneGeometry(0.35, 0.35);

    for (let i = 0; i < this.maxSparks; i++) {
      const mesh = new THREE.Mesh(geo, this.material.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this.sparks.push({
        mesh,
        life: 0,
        maxLife: 0.45,
        velocity: new THREE.Vector3()
      });
    }
  }

  emit(position, normal, count = 25, speedScale = 1.0) {
    for (let c = 0; c < count; c++) {
      const s = this.sparks[this.nextIndex];
      this.nextIndex = (this.nextIndex + 1) % this.maxSparks;

      s.life = 0.3 + Math.random() * 0.25;
      s.maxLife = s.life;

      s.mesh.position.copy(position);
      s.mesh.position.y = Math.max(0.2, s.mesh.position.y);

      // Shower in direction of impact normal + random spread
      const spraySpeed = (8 + Math.random() * 16) * speedScale;
      s.velocity.set(
        (normal.x * 0.6 + (Math.random() - 0.5) * 1.2) * spraySpeed,
        (Math.random() * 0.8 + 0.3) * spraySpeed * 0.7,
        (normal.z * 0.6 + (Math.random() - 0.5) * 1.2) * spraySpeed
      );

      s.mesh.material.opacity = 1.0;
      s.mesh.scale.set(1, 1, 1);
      s.mesh.visible = true;
    }
  }

  update(delta, camera) {
    const gravity = 22.0;

    for (let i = 0; i < this.maxSparks; i++) {
      const s = this.sparks[i];
      if (!s.mesh.visible) continue;

      s.life -= delta;
      if (s.life <= 0) {
        s.mesh.visible = false;
        continue;
      }

      // Physics
      s.velocity.y -= gravity * delta;
      s.mesh.position.addScaledVector(s.velocity, delta);

      // Bounce off ground
      if (s.mesh.position.y < 0.05) {
        s.mesh.position.y = 0.05;
        s.velocity.y = -s.velocity.y * 0.35;
        s.velocity.x *= 0.6;
        s.velocity.z *= 0.6;
      }

      // Fade out
      const ratio = s.life / s.maxLife;
      s.mesh.material.opacity = ratio;
      const scale = 0.5 + ratio * 0.6;
      s.mesh.scale.set(scale, scale, scale);

      // Face camera
      if (camera) {
        s.mesh.quaternion.copy(camera.quaternion);
      }
    }
  }
}
