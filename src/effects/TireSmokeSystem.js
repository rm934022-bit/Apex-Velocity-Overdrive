/**
 * Apex Velocity: Overdrive
 * Dynamic 3D Tire Smoke & Drift Particle System
 * Emits soft fading smoke puffs when drifting or hard braking at speed
 */

import * as THREE from 'three';

export class TireSmokeSystem {
  constructor(scene, maxParticles = 60) {
    this.scene = scene;
    this.maxParticles = maxParticles;
    this.particles = [];
    this.nextIndex = 0;

    // Procedural soft smoke puff texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(240, 245, 255, 0.7)');
    grad.addColorStop(0.4, 'rgba(210, 225, 240, 0.35)');
    grad.addColorStop(0.8, 'rgba(180, 200, 220, 0.1)');
    grad.addColorStop(1, 'rgba(180, 200, 220, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    this.material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    const geometry = new THREE.PlaneGeometry(1.2, 1.2);

    for (let i = 0; i < this.maxParticles; i++) {
      const mesh = new THREE.Mesh(geometry, this.material.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        life: 0,
        maxLife: 0.6,
        size: 0.8,
        growth: 2.2,
        velocity: new THREE.Vector3()
      });
    }
  }

  emit(position, velocity, count = 2) {
    for (let c = 0; c < count; c++) {
      const p = this.particles[this.nextIndex];
      this.nextIndex = (this.nextIndex + 1) % this.maxParticles;

      p.life = 0.55 + Math.random() * 0.15;
      p.maxLife = p.life;
      p.size = 0.65 + Math.random() * 0.35;
      p.growth = 2.4 + Math.random() * 1.2;

      p.mesh.position.copy(position);
      p.mesh.position.x += (Math.random() - 0.5) * 0.3;
      p.mesh.position.y = 0.18 + Math.random() * 0.1;
      p.mesh.position.z += (Math.random() - 0.5) * 0.3;

      p.velocity.copy(velocity).multiplyScalar(0.2);
      p.velocity.y += 0.8 + Math.random() * 0.6;
      p.velocity.x += (Math.random() - 0.5) * 0.8;
      p.velocity.z += (Math.random() - 0.5) * 0.8;

      p.mesh.scale.set(p.size, p.size, p.size);
      p.mesh.material.opacity = 0.55;
      p.mesh.visible = true;
    }
  }

  update(delta, camera) {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.mesh.visible) continue;

      p.life -= delta;
      if (p.life <= 0) {
        p.mesh.visible = false;
        continue;
      }

      // Physics motion
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.velocity.multiplyScalar(0.94); // air resistance

      // Scale expansion
      p.size += delta * p.growth;
      p.mesh.scale.set(p.size, p.size, p.size);

      // Fade out
      const progress = p.life / p.maxLife;
      p.mesh.material.opacity = progress * 0.45;

      // Face camera
      if (camera) {
        p.mesh.quaternion.copy(camera.quaternion);
      }
    }
  }
}
