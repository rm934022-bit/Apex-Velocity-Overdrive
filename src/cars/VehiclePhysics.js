/**
 * Apex Velocity: Overdrive
 * Realistic Supercar Physics Engine
 * Calibrated against real-life exotic V8 supercar specs (Ferrari 458 / F8 Tributo):
 * - Authentic 0-100 km/h in ~3.2s, 0-200 km/h in ~10.0s, natural top speed ~325 km/h
 * - True aerodynamic drag (0.5 * rho * Cd * A * v^2) and 6-speed gear power bands
 * - High-performance carbon-ceramic braking (100-0 in ~2.2s / 30m)
 * - Accessible easy-arcade steering assist, road curve tracking, and soft bumper rails
 * - Nitrous boost surging top speed to ~365 km/h with thrilling exhaust flames
 */

import * as THREE from 'three';

export class VehiclePhysics {
  constructor(carData, soundEngine) {
    this.carData = carData || {};
    this.soundEngine = soundEngine;

    // Physical Properties (Authentic mid-engine V8 supercar)
    this.mass = 1435; // kg
    this.dragCoeff = 0.385; // Aerodynamic drag factor (0.5 * rho * Cd * A)
    this.rollingResistance = 180; // Newtons
    this.topSpeedKmh = carData.topSpeedKmh || 325;
    this.maxSpeed = this.topSpeedKmh / 3.6; // ~90.3 m/s

    // Gearing & Tractive Force Curve (Newtons at wheels per gear)
    this.gears = [
      { gear: 1, minSpeed: 0,          maxSpeed: 72 / 3.6,  force: 14200, minRpm: 1500, maxRpm: 8500 },
      { gear: 2, minSpeed: 60 / 3.6,   maxSpeed: 125 / 3.6, force: 9800,  minRpm: 5200, maxRpm: 8500 },
      { gear: 3, minSpeed: 110 / 3.6,  maxSpeed: 175 / 3.6, force: 6900,  minRpm: 5500, maxRpm: 8500 },
      { gear: 4, minSpeed: 160 / 3.6,  maxSpeed: 230 / 3.6, force: 5100,  minRpm: 5600, maxRpm: 8500 },
      { gear: 5, minSpeed: 215 / 3.6,  maxSpeed: 280 / 3.6, force: 3900,  minRpm: 5800, maxRpm: 8500 },
      { gear: 6, minSpeed: 265 / 3.6,  maxSpeed: 335 / 3.6, force: 3100,  minRpm: 5900, maxRpm: 8500 }
    ];

    // State Variables
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3();
    this.speed = 0; // forward speed in m/s
    this.rotationY = 0; // yaw heading angle
    this.chassisRoll = 0;
    this.chassisPitch = 0;

    // Transmission State
    this.gear = 1;
    this.rpm = 1500;
    this.shiftCooldown = 0;

    // Steering & Handling
    this.steerAngle = 0;
    this.handling = (carData.handling || 1.0) * 1.15;

    // Nitrous Boost
    this.nitro = 100;
    this.maxNitro = 100;
    this.isBoosting = false;

    // Optional Drift (holding Space)
    this.isDrifting = false;
    this.driftAngle = 0;
    this.driftPoints = 0;
    this.currentDriftScore = 0;
    this.driftMultiplier = 1.0;

    // Track surface & collisions
    this.isOnGrass = false;
    this.crashCooldown = 0;
    this.onCrash = null;
  }

  update(delta, input, trackBounds = null) {
    const rawThrottle = input.forward || 0;
    const rawSteer = input.steer || 0; // -1 for Left (A), +1 for Right (D)
    const handbrake = input.handbrake || false;
    const boost = input.boost || false;

    const absSpeed = Math.abs(this.speed);
    const speedKmh = absSpeed * 3.6;

    // =========================================================================
    // 1. TRACK LIMITS & HIGH-SPEED WALL / GUARDRAIL CRASH COLLISIONS
    // =========================================================================
    this.crashCooldown = Math.max(0, this.crashCooldown - delta);
    this.isOnGrass = false;

    if (trackBounds && trackBounds.getClosestTrackInfo) {
      const trackInfo = trackBounds.getClosestTrackInfo(this.position);
      const dist = trackInfo.distance;

      // 1A. Rumble Curb / Outer Grass Slowdown (Outside 10.4m)
      if (dist > 10.4 && dist < 11.2) {
        this.isOnGrass = true;
        // Grass / rough gravel friction slows the car down
        this.speed *= Math.max(0.7, 1.0 - delta * 0.45);
        this.chassisRoll = THREE.MathUtils.lerp(this.chassisRoll, (Math.random() - 0.5) * 0.04, delta * 12.0);
      }

      // 1B. HARD WALL / GUARDRAIL COLLISION (At dist >= 11.2m)
      if (dist >= 11.2) {
        const impactSpeed = Math.abs(this.speed);
        const impactSpeedKmh = impactSpeed * 3.6;

        // Position clamp: physically keep the car inside the track boundary
        const offsetVec = this.position.clone().sub(trackInfo.closestPoint);
        const clampedVec = offsetVec.normalize().multiplyScalar(11.15);
        this.position.x = trackInfo.closestPoint.x + clampedVec.x;
        this.position.z = trackInfo.closestPoint.z + clampedVec.z;

        // Gentle recoil pushing car back inward toward drivable lane
        this.position.add(trackInfo.normal.clone().multiplyScalar(0.28));

        // Align heading along track tangent so the car glances and slides along the barrier
        if (trackBounds && trackBounds.spline) {
          const t = trackInfo.index / trackBounds.sampleCount;
          const tangent = trackBounds.spline.getTangentAt(t).normalize();
          const targetHeading = Math.atan2(tangent.x, tangent.z);
          let diff = targetHeading - this.rotationY;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          this.rotationY += diff * 0.32;
        }

        // Continuous barrier grind friction (decelerates but preserves forward motion, never dead stops)
        const speedSign = this.speed >= 0 ? 1 : -1;
        if (impactSpeed > 8.5) {
          this.speed = speedSign * Math.max(8.5, impactSpeed * Math.max(0.75, 1.0 - delta * 0.45));
        }

        // Barrier scraping audio
        if (this.soundEngine && this.soundEngine.setBarrierScrape) {
          this.soundEngine.setBarrierScrape(Math.min(0.7, impactSpeed / 25));
        }

        // CRASH EVENT & REALISTIC SPEED SHED (PRESERVES FORWARD ROLLING MOTION)
        if (impactSpeed > 3.5 && this.crashCooldown === 0) {
          this.crashCooldown = 0.32;

          // Realistic deceleration: sheds speed down to a manageable crawl/glide (~35–55 km/h)
          // The car never stops dead; it keeps forward motion so the player can steer out.
          if (impactSpeedKmh > 140) {
            this.speed = speedSign * Math.max(12.5, impactSpeed * 0.44); // ~45–55 km/h glide
          } else if (impactSpeedKmh > 70) {
            this.speed = speedSign * Math.max(10.0, impactSpeed * 0.55); // ~36–45 km/h glide
          } else {
            this.speed = speedSign * Math.max(8.5, impactSpeed * 0.70); // ~30–35 km/h roll
          }

          // Cancel nitro
          this.isBoosting = false;

          // Crash Shock Visuals: chassis shudder & suspension compression
          const rollDir = Math.random() > 0.5 ? 1 : -1;
          this.chassisRoll = rollDir * Math.min(0.35, 0.12 + (impactSpeed / 35) * 0.18);
          this.chassisPitch = Math.min(0.24, 0.08 + (impactSpeed / 35) * 0.14);

          // Audio impact crunch
          if (this.soundEngine && impactSpeedKmh > 20) {
            this.soundEngine.playCrash(Math.min(1.0, impactSpeedKmh / 140));
          }

          // Callback to main engine for sparks and tire smoke
          if (this.onCrash) {
            this.onCrash({
              speedKmh: Math.round(impactSpeedKmh),
              position: this.position.clone(),
              normal: trackInfo.normal.clone()
            });
          }
        }
      } else {
        if (this.soundEngine && this.soundEngine.setBarrierScrape) {
          this.soundEngine.setBarrierScrape(0);
        }
      }
    } else {
      if (this.soundEngine && this.soundEngine.setBarrierScrape) {
        this.soundEngine.setBarrierScrape(0);
      }
    }

    // =========================================================================
    // 2. NITRO BOOST
    // =========================================================================
    const wasBoosting = this.isBoosting;
    this.isBoosting = false;
    let nitroForceBonus = 0;

    if (boost && this.nitro > 2 && rawThrottle > 0) {
      this.isBoosting = true;
      if (!wasBoosting && this.soundEngine && this.soundEngine.playNitroRoar) {
        this.soundEngine.playNitroRoar();
      }
      nitroForceBonus = 5200; // Adds +200 HP equivalent boost
      this.nitro = Math.max(0, this.nitro - delta * 25.0);
    } else {
      if (wasBoosting && this.soundEngine && this.soundEngine.setNitroActive) {
        this.soundEngine.setNitroActive(false);
      }
      // Automatic recharge (+8%/sec, +30%/sec while drifting)
      const recharge = this.isDrifting ? 30.0 : 8.0;
      this.nitro = Math.min(this.maxNitro, this.nitro + delta * recharge);
    }

    // =========================================================================
    // 3. REALISTIC ENGINE TRACTIVE FORCE, AERODYNAMIC DRAG & ACCELERATION
    // =========================================================================
    // Aerodynamic Drag Force: F_drag = 0.5 * rho * Cd * A * v^2
    const aeroDrag = this.dragCoeff * this.speed * this.speed;
    const totalResistance = aeroDrag + (absSpeed > 0.1 ? this.rollingResistance : 0);

    if (rawThrottle > 0) {
      // Forward Drive
      if (this.gear === 'R' || typeof this.gear !== 'number') {
        this.gear = 1;
      }
      this._updateGearsAndRpm(delta);
      const gearIdx = Math.max(0, Math.min(this.gears.length - 1, (typeof this.gear === 'number' ? this.gear - 1 : 0)));
      const currentGearData = this.gears[gearIdx];

      // Engine tractive force (tapers slightly near top of each gear)
      const gearSpan = Math.max(1.0, currentGearData.maxSpeed - currentGearData.minSpeed);
      const progressInGear = Math.max(0, Math.min(1.0, (Math.max(0, this.speed) - currentGearData.minSpeed) / gearSpan));
      const torqueTaper = 1.0 - progressInGear * 0.15;
      const engineTractiveForce = (currentGearData.force * torqueTaper + nitroForceBonus) * rawThrottle;

      // Net Force = F_engine - F_drag - F_rolling
      const netForce = Math.max(-200, engineTractiveForce - totalResistance);
      const acceleration = netForce / this.mass;

      this.speed += acceleration * delta;

      // Hard max speed cap (natural ~325 km/h, with nitro ~365 km/h)
      const absoluteTopSpeed = this.isBoosting ? 365 / 3.6 : this.maxSpeed;
      if (this.speed > absoluteTopSpeed) {
        this.speed = THREE.MathUtils.lerp(this.speed, absoluteTopSpeed, delta * 2.0);
      }
    } else if (rawThrottle < 0) {
      // Braking & Reverse
      if (this.speed > 1.2) {
        // High-Performance Brembo Carbon-Ceramic Brakes (stops 100-0 km/h in ~2.2s / ~30m)
        const brakeDecel = 12.5; // m/s^2 (~1.27G braking force)
        this.speed = Math.max(0, this.speed - brakeDecel * Math.abs(rawThrottle) * delta);
        this.rpm = Math.max(1200, this.rpm - delta * 4500);
      } else {
        // Reverse Drive (smooth reverse up to 45 km/h)
        const maxReverse = -12.5; // ~45 km/h
        this.speed = Math.max(maxReverse, this.speed - 8.0 * delta);
        this.gear = 'R';
        this.rpm = 1500 + Math.abs(this.speed / 12.5) * 4500;
      }
    } else {
      // Coasting: Engine braking & Aerodynamic Drag naturally decelerate the car
      const coastDecel = (totalResistance + 400) / this.mass;
      this.speed = THREE.MathUtils.lerp(this.speed, 0, delta * Math.min(2.5, coastDecel));
      this.rpm = THREE.MathUtils.lerp(this.rpm, 1200, delta * 3.0);
    }

    // =========================================================================
    // 4. RESPONSIVE EASY ARCADE STEERING
    // =========================================================================
    if (absSpeed > 0.2) {
      const turnDir = this.speed >= -0.5 ? 1 : -1;
      // Generous turning authority so every bend is smooth and achievable
      const turnRate = (this.isDrifting ? 3.2 : 2.5) * this.handling;
      const speedFactor = Math.min(1.0, absSpeed / 2.5);

      this.rotationY += -rawSteer * turnRate * speedFactor * turnDir * delta;
    }

    // Front wheels visual steer angle
    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, -rawSteer * 0.42, delta * 16.0);

    // =========================================================================
    // 5. OPTIONAL DRIFTING (ONLY WHEN HOLDING SPACE)
    // =========================================================================
    if (handbrake && absSpeed > 10.0) {
      this.isDrifting = true;
      const driftSign = rawSteer >= 0 ? 1 : -1;
      this.driftAngle = THREE.MathUtils.lerp(this.driftAngle, 0.32 * driftSign, delta * 8.0);

      // Accumulate drift score & rapid nitro refill
      this.currentDriftScore += Math.round(absSpeed * 40 * delta);
      this.driftMultiplier = Math.min(4.0, 1.0 + Math.floor(this.currentDriftScore / 1800) * 0.5);

      if (this.soundEngine && this.soundEngine.setTireScreech) {
        this.soundEngine.setTireScreech(0.65);
      }
    } else {
      if (this.isDrifting) {
        // Clean exit with mini-boost
        this.isDrifting = false;
        if (this.currentDriftScore > 0) {
          this.driftPoints += Math.round(this.currentDriftScore * this.driftMultiplier);
          this.currentDriftScore = 0;
          this.driftMultiplier = 1.0;
        }
        this.speed = Math.min(this.maxSpeed * 1.05, this.speed + 3.0);
      }
      this.driftAngle = THREE.MathUtils.lerp(this.driftAngle, 0, delta * 14.0);

      if (this.soundEngine && this.soundEngine.setTireScreech) {
        this.soundEngine.setTireScreech(0);
      }
    }

    // =========================================================================
    // 6. POSITION & VELOCITY INTEGRATION
    // =========================================================================
    const travelAngle = this.rotationY + this.driftAngle;
    const forwardVec = new THREE.Vector3(Math.sin(travelAngle), 0, Math.cos(travelAngle));

    this.velocity.copy(forwardVec.multiplyScalar(this.speed));
    this.position.add(this.velocity.clone().multiplyScalar(delta));

    // =========================================================================
    // 7. REALISTIC BODY WEIGHT TRANSFER (PITCH & ROLL)
    // =========================================================================
    // Throttle squat / brake dive
    const targetPitch = rawThrottle > 0 ? -0.03 : (rawThrottle < 0 ? 0.045 : 0);
    this.chassisPitch = THREE.MathUtils.lerp(this.chassisPitch, targetPitch, delta * 10.0);

    // Lateral cornering roll
    const speedRatio = Math.min(1.0, absSpeed / this.maxSpeed);
    const targetRoll = -this.steerAngle * speedRatio * 0.10;
    this.chassisRoll = THREE.MathUtils.lerp(this.chassisRoll, targetRoll, delta * 12.0);

    // =========================================================================
    // 8. ENGINE SOUND, BRAKE DISC & AERODYNAMIC WIND SYNTHESIS
    // =========================================================================
    if (this.soundEngine) {
      if (this.soundEngine.updateEngine) {
        const rpmFraction = Math.max(0, Math.min(1.0, (this.rpm - 1500) / 7000));
        this.soundEngine.updateEngine(rpmFraction, rawThrottle, speedKmh);
      }
      if (this.soundEngine.setBrakeSound) {
        const isBraking = rawThrottle < 0 || handbrake;
        const brakeForce = isBraking ? Math.max(Math.abs(rawThrottle), handbrake ? 0.9 : 0) : 0;
        this.soundEngine.setBrakeSound(brakeForce, speedKmh);
      }
      if (this.soundEngine.updateWind) {
        this.soundEngine.updateWind(speedKmh);
      }
    }
  }

  _updateGearsAndRpm(delta) {
    if (this.speed < 0) return;

    this.shiftCooldown = Math.max(0, this.shiftCooldown - delta);

    // Automatic gear shifting based on speed ranges
    let targetGear = 1;
    for (let i = 0; i < this.gears.length; i++) {
      if (this.speed >= this.gears[i].minSpeed) {
        targetGear = this.gears[i].gear;
      }
    }

    // Trigger turbo blow-off sound on upshift
    if (targetGear > this.gear && this.shiftCooldown === 0) {
      if (this.soundEngine && this.soundEngine.playTurboBlowOff) {
        this.soundEngine.playTurboBlowOff();
      }
      this.shiftCooldown = 0.4;
    }
    this.gear = targetGear;

    // Calculate RPM inside the current gear
    const gData = this.gears[this.gear - 1];
    const gearSpan = Math.max(1.0, gData.maxSpeed - gData.minSpeed);
    const progress = Math.max(0, Math.min(1.0, (this.speed - gData.minSpeed) / gearSpan));

    const targetRpm = gData.minRpm + progress * (gData.maxRpm - gData.minRpm);
    this.rpm = THREE.MathUtils.lerp(this.rpm, targetRpm, delta * 12.0);
  }

  getSpeedKmh() {
    return Math.round(Math.abs(this.speed) * 3.6);
  }

  getPosition() {
    return this.position;
  }

  getRotationY() {
    return this.rotationY;
  }
}
