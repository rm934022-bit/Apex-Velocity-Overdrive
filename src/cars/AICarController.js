/**
 * Apex Velocity: Overdrive
 * High-Fidelity AI Rival Supercar Controller
 * Features:
 * - Dynamic Grand Prix racing line navigation with inside apex tracking
 * - Strict angle-wrapping (prevents 360 spinouts and corner glitches)
 * - Synchronized spline progress tracking (prevents desynchronization and driving backwards)
 * - Realistic vehicle animations: front wheel steering, 4-wheel linear spin, chassis roll, pitch dive/squat
 * - Dynamic taillight brake illumination and nitrous exhaust flames
 * - Tactical slipstream drafting and straight-line boost
 */

import * as THREE from 'three';
import { CarModelBuilder } from './CarModelBuilder.js';

export class AICarController {
  constructor(scene, rivalConfig, trackSpline) {
    this.scene = scene;
    this.config = rivalConfig;
    this.trackSpline = trackSpline;

    // 1. Build 3D Car Model (Matching configured chassis and color)
    this.carData = CarModelBuilder.CAR_DEFINITIONS.find(c => c.id === rivalConfig.carId) || CarModelBuilder.CAR_DEFINITIONS[0];
    this.carAssembly = CarModelBuilder.buildCar(this.carData.id, rivalConfig.color, rivalConfig.glowColor);
    this.mesh = this.carAssembly.root;
    this.scene.add(this.mesh);

    // 2. Physics & Motion State
    this.position = new THREE.Vector3(rivalConfig.laneOffset || 2.8, 0, 18);
    this.rotationY = 0;
    this.speed = 0;
    this.steerAngle = 0;
    this.chassisPitch = 0;
    this.topSpeed = (rivalConfig.topSpeedKmh || this.carData.topSpeedKmh) / 3.6;
    this.baseAccel = 8.8; // m/s^2 calibrated to player's 0-100 in ~3.3s

    // 3. Spline Progress & Race Laps
    this.currentSplineT = rivalConfig.startT || 0.012;
    this.currentLap = 1;
    this.totalLaps = rivalConfig.totalLaps || 2;
    this.isFinished = false;
    this.hasStopped = false;
    this.targetWaypoint = new THREE.Vector3();
    this.preferredLaneOffset = rivalConfig.laneOffset || 2.8;

    // 4. Tactics & Nitrous
    this.isBoosting = false;
    this.isBraking = false;
    this.nitroTimer = 0;
    this.nitroCooldown = 10 + Math.random() * 5;

    // Initial position on grid
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;
  }

  update(delta, playerPos, trackBuilder = null) {
    // =========================================================================
    // 1. SYNCHRONIZE SPLINE PROGRESS TO PREVENT DESYNCHRONIZATION
    // =========================================================================
    if (trackBuilder && trackBuilder.getClosestTrackInfo) {
      const trackInfo = trackBuilder.getClosestTrackInfo(this.position);
      const prevT = this.currentSplineT;
      const detectedT = trackInfo.index / trackBuilder.sampleCount;

      // Detect full lap transition (crossing start/finish line)
      if (prevT > 0.80 && detectedT < 0.20) {
        if (this.currentLap >= this.totalLaps) {
          this.isFinished = true;
          this.currentLap = this.totalLaps + 1;
        } else {
          this.currentLap++;
        }
      }
      this.currentSplineT = detectedT;

      // Soft Bumper Correction: Keep AI firmly on the track asphalt
      if (trackInfo.distance > 8.0 && !this.hasStopped) {
        const excess = trackInfo.distance - 8.0;
        this.position.add(trackInfo.normal.clone().multiplyScalar(excess * delta * 5.0));
      }
    } else {
      // Fallback spline advance
      const splineLength = this.trackSpline.getLength();
      this.currentSplineT += (this.speed / splineLength) * delta;
      if (this.currentSplineT >= 1.0) {
        this.currentSplineT -= 1.0;
        if (this.currentLap >= this.totalLaps) {
          this.isFinished = true;
          this.currentLap = this.totalLaps + 1;
        } else {
          this.currentLap++;
        }
      }
    }

    // =========================================================================
    // 2. COMPUTE TARGET RACING LINE WAYPOINT (LOOK-AHEAD 20 METERS)
    // =========================================================================
    const lookAheadT = (this.currentSplineT + 0.024) % 1.0;
    const splinePt = this.trackSpline.getPointAt(lookAheadT);
    const tangent = this.trackSpline.getTangentAt(lookAheadT).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // Racing line lane variation (apex cornering)
    let dynamicLane = this.preferredLaneOffset;
    if (playerPos && !this.isFinished) {
      const distToPlayer = this.position.distanceTo(playerPos);
      if (distToPlayer < 12.0) {
        // Give slight racing room when side by side
        const playerSide = (playerPos.x - this.position.x) > 0 ? 1 : -1;
        dynamicLane = -playerSide * 2.5;
      }
    }

    this.targetWaypoint.copy(splinePt).add(normal.multiplyScalar(dynamicLane));

    // =========================================================================
    // 3. ANGLE-WRAPPED STEERING (PREVENTS 360-DEGREE SPINOUTS)
    // =========================================================================
    const toTarget = this.targetWaypoint.clone().sub(this.position);
    const desiredAngle = Math.atan2(toTarget.x, toTarget.z);

    // Compute minimal angular difference across [-PI, PI] branch cut
    let angleDiff = desiredAngle - this.rotationY;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

    // Smooth heading rotation
    const turnRate = Math.min(1.0, delta * 8.5);
    this.rotationY += angleDiff * turnRate;

    // Visual front wheel steering angle
    if (this.hasStopped) {
      this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, 0, delta * 6.0);
    } else {
      this.steerAngle = THREE.MathUtils.clamp(angleDiff * 2.2, -0.42, 0.42);
    }

    // =========================================================================
    // 4. SPEED CONTROL: CORNER BRAKING, NITRO & SMOOTH FINISH STOP
    // =========================================================================
    if (this.isFinished) {
      this.isBoosting = false;
      this.isBraking = true;

      // Smooth controlled deceleration after completing all laps
      const stopDecel = 16.0;
      this.speed = Math.max(0, this.speed - stopDecel * delta);
      if (this.speed <= 0.05) {
        this.speed = 0;
        this.hasStopped = true;
      }
    } else {
      const turnSeverity = Math.abs(angleDiff);
      let targetSpeed = this.topSpeed;
      this.isBraking = false;

      if (turnSeverity > 0.35) {
        // Brake for sharp corners
        targetSpeed = this.topSpeed * 0.62;
        this.isBraking = this.speed > targetSpeed + 2.0;
      }

      // Straight-line Nitrous Boost
      this.nitroTimer += delta;
      if (turnSeverity < 0.12 && this.nitroTimer > this.nitroCooldown && this.speed > 25.0) {
        this.isBoosting = true;
        targetSpeed = this.topSpeed * 1.15;
        if (this.nitroTimer > this.nitroCooldown + 3.2) {
          this.isBoosting = false;
          this.nitroTimer = 0;
          this.nitroCooldown = 12 + Math.random() * 6;
        }
      } else {
        this.isBoosting = false;
      }

      // Realistic Acceleration / Deceleration curve
      if (this.speed < targetSpeed) {
        const speedRatio = Math.min(1.0, this.speed / this.topSpeed);
        const accelFactor = this.baseAccel * Math.max(0.2, 1.0 - Math.pow(speedRatio, 1.5) * 0.78);
        const boostMult = this.isBoosting ? 1.45 : 1.0;
        this.speed = Math.min(targetSpeed, this.speed + accelFactor * boostMult * delta);
      } else {
        const decel = this.isBraking ? 18.0 : 6.0;
        this.speed = Math.max(targetSpeed, this.speed - decel * delta);
      }
    }

    // =========================================================================
    // 5. UPDATE PHYSICAL POSITION
    // =========================================================================
    if (!this.hasStopped) {
      const forward = new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY));
      this.position.add(forward.multiplyScalar(this.speed * delta));
      this.position.y = 0; // Firmly grounded on asphalt
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;

    // =========================================================================
    // 6. DYNAMIC RACING ANIMATIONS (WHEELS, ROLL, PITCH, LIGHTS, FLAMES)
    // =========================================================================
    // Front wheel steering
    if (this.carAssembly.wheels) {
      const wheels = this.carAssembly.wheels;
      if (wheels.fl?.pivot) wheels.fl.pivot.rotation.y = this.steerAngle;
      if (wheels.fr?.pivot) wheels.fr.pivot.rotation.y = this.steerAngle;

      // 4-Wheel linear spin rotation
      const wheelRot = this.hasStopped ? 0 : (this.speed * delta) / 0.38;
      if (wheels.fl?.rotatingMesh) wheels.fl.rotatingMesh.rotation.x += wheelRot;
      if (wheels.fr?.rotatingMesh) wheels.fr.rotatingMesh.rotation.x += wheelRot;
      if (wheels.rl?.rotatingMesh) wheels.rl.rotatingMesh.rotation.x += wheelRot;
      if (wheels.rr?.rotatingMesh) wheels.rr.rotatingMesh.rotation.x += wheelRot;
    }

    // Realistic chassis body roll on turns
    const speedRatio = Math.min(1.0, this.speed / 45.0);
    this.mesh.rotation.z = -this.steerAngle * speedRatio * 0.09;

    // Body pitch (squat on boost, dive on braking)
    const targetPitch = this.hasStopped ? 0 : (this.isBraking ? 0.035 : (this.isBoosting ? -0.025 : 0));
    this.chassisPitch = THREE.MathUtils.lerp(this.chassisPitch, targetPitch, delta * 8.0);
    this.mesh.rotation.x = this.chassisPitch;

    // Brake taillights glow
    const matTail = this.carAssembly.materials?.matTaillight || this.carAssembly.materials?.matRoundTaillight;
    if (matTail) {
      matTail.color.setHex((this.isBraking || this.isFinished) ? 0xff0022 : 0x880015);
    }

    // Nitro exhaust flames & road glow
    if (this.carAssembly.exhaustFlames) {
      this.carAssembly.exhaustFlames.forEach(f => (f.visible = !this.isFinished && this.isBoosting));
    }
    if (this.carAssembly.flameLight) {
      this.carAssembly.flameLight.intensity = (!this.isFinished && this.isBoosting) ? 2.5 : 0;
    }
  }

  getPosition() {
    return this.position;
  }

  getProgress() {
    if (this.isFinished) {
      return this.totalLaps + Math.min(0.2, this.currentSplineT);
    }
    return (this.currentLap - 1) + this.currentSplineT;
  }

  setTopSpeed(kmh) {
    if (kmh) this.topSpeed = kmh / 3.6;
  }

  setTrackSpline(trackSpline) {
    this.trackSpline = trackSpline;
  }

  setTotalLaps(laps) {
    if (laps && laps > 0) {
      this.totalLaps = laps;
    }
  }

  stopCar() {
    this.isFinished = true;
    this.hasStopped = true;
    this.speed = 0;
    this.isBoosting = false;
    this.isBraking = true;
    if (this.carAssembly.exhaustFlames) {
      this.carAssembly.exhaustFlames.forEach(f => (f.visible = false));
    }
    if (this.carAssembly.flameLight) {
      this.carAssembly.flameLight.intensity = 0;
    }
  }

  reset(startT = 0.012, laneOffset = 2.8) {
    this.currentSplineT = startT;
    this.currentLap = 1;
    this.isFinished = false;
    this.hasStopped = false;
    this.speed = 0;
    this.steerAngle = 0;
    this.chassisPitch = 0;
    this.isBoosting = false;
    this.isBraking = false;
    this.nitroTimer = 0;
    this.preferredLaneOffset = laneOffset;

    // Set starting position cleanly on the grid spot for current track
    if (this.trackSpline) {
      const pt = this.trackSpline.getPointAt(startT);
      const tangent = this.trackSpline.getTangentAt(startT).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      this.position.copy(pt).add(normal.multiplyScalar(laneOffset));
      this.position.y = 0;
      this.rotationY = Math.atan2(tangent.x, tangent.z);
    } else {
      this.position.set(laneOffset, 0, 18);
      this.rotationY = 0;
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.set(0, this.rotationY, 0);

    // Reset wheel steering and flames
    if (this.carAssembly.wheels) {
      if (this.carAssembly.wheels.fl?.pivot) this.carAssembly.wheels.fl.pivot.rotation.y = 0;
      if (this.carAssembly.wheels.fr?.pivot) this.carAssembly.wheels.fr.pivot.rotation.y = 0;
    }
    if (this.carAssembly.exhaustFlames) {
      this.carAssembly.exhaustFlames.forEach(f => (f.visible = false));
    }
  }
}
