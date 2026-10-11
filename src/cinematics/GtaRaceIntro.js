/**
 * Apex Velocity: Overdrive
 * GTA 5 Style Cinematic Race Start Animation System
 *
 * Recreates Grand Theft Auto V / GTA Online's iconic race start sequence:
 * 1. High-altitude sky satellite perspective overlooking starting grid & grandstands
 * 2. Dramatic widescreen letterbox bars & sleek GTA 5 title card with circuit info
 * 3. High-velocity exponential camera swoop / dive with motion blur & whoosh sound
 * 4. Heavy sub-bass impact boom as camera locks behind the car's bumper
 * 5. Synchronized starting gantry countdown (3-2-1-GO) with high-intensity neon bloom
 * 6. Smooth transition to full gameplay controls & Eurobeat soundtrack launch
 */

import * as THREE from 'three';

export class GtaRaceIntro {
  constructor(camera, soundEngine) {
    this.camera = camera;
    this.soundEngine = soundEngine;

    // Sequence State
    this.isActive = false;
    this.timer = 0;
    this.totalDuration = 6.2; // Seconds
    this.onCompleteCallback = null;

    // Camera Coordinates
    this.startCamPos = new THREE.Vector3();
    this.startLookAt = new THREE.Vector3();
    this.targetCamPos = new THREE.Vector3();
    this.targetLookAt = new THREE.Vector3();

    // Intermediate Waypoints
    this.skyCamPos = new THREE.Vector3();
    this.skyLookAt = new THREE.Vector3();

    // UI Overlay References
    this.overlay = document.getElementById('gta-cinematic-overlay');
    this.letterboxTop = document.getElementById('gta-letterbox-top');
    this.letterboxBottom = document.getElementById('gta-letterbox-bottom');
    this.titleCard = document.getElementById('gta-title-card');
    this.titleText = document.getElementById('gta-track-title');
    this.subtitleText = document.getElementById('gta-track-subtitle');
    this.gridSlotBadge = document.getElementById('gta-grid-slot-badge');
    this.countdownOverlay = document.getElementById('countdown-overlay');
    this.countdownText = document.getElementById('countdown-text');

    this.lightPods = [
      document.getElementById('light-1'),
      document.getElementById('light-2'),
      document.getElementById('light-3'),
      document.getElementById('light-go')
    ];

    // Audio Trigger Milestones
    this.whooshTriggered = false;
    this.bassDropTriggered = false;
    this.lastCountSecond = -1;

    // Bind Skip Key (disabled in multiplayer to maintain synchronized grid launch)
    window.addEventListener('keydown', (e) => {
      if (this.isActive && !this.isMultiplayer && (e.code === 'Space' || e.code === 'Enter')) {
        this.skip();
      }
    });
  }

  start(playerPos, heading, level, gridSlot = 1, onComplete = null, isMultiplayer = false) {
    this.isActive = true;
    this.isMultiplayer = !!isMultiplayer;
    this.timer = 0;
    this.whooshTriggered = false;
    this.bassDropTriggered = false;
    this.lastCountSecond = -1;
    this.onCompleteCallback = onComplete;

    // 1. Calculate Target Chase Camera (Behind Car)
    const chaseDist = 5.6;
    const chaseHeight = 2.2;
    const offsetBack = new THREE.Vector3(
      -Math.sin(heading) * chaseDist,
      chaseHeight,
      -Math.cos(heading) * chaseDist
    );
    this.targetCamPos.copy(playerPos).add(offsetBack);
    this.targetLookAt.copy(playerPos).add(new THREE.Vector3(
      Math.sin(heading) * 8.0,
      1.15,
      Math.cos(heading) * 8.0
    ));

    // 2. Calculate High Sky Satellite Camera (GTA 5 Bird's Eye View)
    // High in the clouds, offset slightly to the side to see the full straight and cars
    const skyAltitude = 72.0;
    const skyBackDist = 55.0;
    const skySideDist = 24.0;
    const normal = new THREE.Vector3(-Math.cos(heading), 0, Math.sin(heading));

    this.skyCamPos.copy(playerPos)
      .add(new THREE.Vector3(
        -Math.sin(heading) * skyBackDist,
        skyAltitude,
        -Math.cos(heading) * skyBackDist
      ))
      .add(normal.clone().multiplyScalar(skySideDist));

    this.skyLookAt.copy(playerPos).add(new THREE.Vector3(
      Math.sin(heading) * 20.0,
      0.5,
      Math.cos(heading) * 20.0
    ));

    // 3. Set Initial Camera
    this.camera.position.copy(this.skyCamPos);
    this.camera.lookAt(this.skyLookAt);
    this.camera.fov = 82;
    this.camera.updateProjectionMatrix();

    // 4. Populate and Show Cinematic UI
    if (this.titleText) this.titleText.textContent = level.title || 'BUDDH GP EXPRESSWAY';
    if (this.subtitleText) this.subtitleText.textContent = `${level.subtitle || 'GREATER NOIDA'} // ${level.laps || 2} LAPS // REAL PBR`;
    if (this.gridSlotBadge) this.gridSlotBadge.textContent = gridSlot === 1 ? 'POLE POSITION // 1ST ON GRID' : `GRID POSITION #${gridSlot}`;

    this._showCinematicUI();
  }

  update(delta, playerPos, heading) {
    if (!this.isActive) return;

    this.timer += delta;
    const t = this.timer;

    // Phase 1: High Sky Satellite Cam (0.0s -> 1.8s)
    if (t < 1.8) {
      // Gentle cinematic panoramic drift
      const driftT = t / 1.8;
      const curPos = this.skyCamPos.clone().add(new THREE.Vector3(
        Math.sin(driftT * 0.5) * 4.0,
        -driftT * 3.0,
        Math.cos(driftT * 0.5) * 4.0
      ));
      this.camera.position.copy(curPos);
      this.camera.lookAt(this.skyLookAt);
      this.camera.fov = 82 - driftT * 4.0;
      this.camera.updateProjectionMatrix();
    }
    // Phase 2: GTA 5 Dramatic Camera Swoop Dive (1.8s -> 3.2s)
    else if (t >= 1.8 && t < 3.2) {
      if (!this.whooshTriggered) {
        this.whooshTriggered = true;
        if (this.soundEngine && this.soundEngine.playGtaWhoosh) {
          this.soundEngine.playGtaWhoosh();
        }
        // Hide title card smoothly as swoop begins
        if (this.titleCard) this.titleCard.classList.add('fade-out');
      }

      // Exponential dive curve (fast acceleration then smooth cushion)
      const swoopProgress = (t - 1.8) / 1.4; // 0.0 to 1.0
      const ease = this._easeInOutCubic(swoopProgress);

      this.camera.position.lerpVectors(this.skyCamPos, this.targetCamPos, ease);
      const curLookAt = new THREE.Vector3().lerpVectors(this.skyLookAt, this.targetLookAt, ease);
      this.camera.lookAt(curLookAt);

      this.camera.fov = THREE.MathUtils.lerp(78, 64, ease);
      this.camera.updateProjectionMatrix();
    }
    // Phase 3: Grid Lock & 3-2-1-GO Countdown (3.2s -> 6.2s)
    else {
      if (!this.bassDropTriggered) {
        this.bassDropTriggered = true;
        if (this.soundEngine && this.soundEngine.playGtaBassDrop) {
          this.soundEngine.playGtaBassDrop();
        }
        // Camera locked directly behind car
        this.camera.position.copy(this.targetCamPos);
        this.camera.lookAt(this.targetLookAt);
        this.camera.fov = 64;
        this.camera.updateProjectionMatrix();

        if (this.countdownOverlay) {
          this.countdownOverlay.classList.remove('hidden');
        }
      }

      // Gentle idle vibration shake behind car
      const idleShakeX = Math.sin(t * 18.0) * 0.018;
      const idleShakeY = Math.cos(t * 22.0) * 0.014;
      this.camera.position.set(
        this.targetCamPos.x + idleShakeX,
        this.targetCamPos.y + idleShakeY,
        this.targetCamPos.z
      );
      this.camera.lookAt(this.targetLookAt);

      // Countdown Milestones (3... 2... 1... GO!)
      const countdownTime = t - 3.2; // 0.0 to 3.0s
      this._updateCountdown(countdownTime);

      // Launch Race on GO!
      if (t >= this.totalDuration) {
        this.finish();
      }
    }
  }

  _updateCountdown(countdownTime) {
    let currentStep = -1;
    let label = 'READY';

    if (countdownTime < 0.8) {
      currentStep = 1; // "3"
      label = '3';
    } else if (countdownTime < 1.6) {
      currentStep = 2; // "2"
      label = '2';
    } else if (countdownTime < 2.4) {
      currentStep = 3; // "1"
      label = '1';
    } else {
      currentStep = 4; // "GO!"
      label = 'GO!';
    }

    if (currentStep !== this.lastCountSecond) {
      this.lastCountSecond = currentStep;

      // Update Gantry Pod Lights
      this.lightPods.forEach((pod, idx) => {
        if (!pod) return;
        const bulb = pod.querySelector('.bulb');
        if (!bulb) return;

        bulb.classList.remove('active-red', 'active-green');
        if (currentStep === 4) {
          if (idx === 3) bulb.classList.add('active-green');
        } else {
          if (idx < currentStep) bulb.classList.add('active-red');
        }
      });

      // Update Text
      if (this.countdownText) {
        this.countdownText.textContent = label;
        this.countdownText.classList.remove('pulse-num', 'go-pulse');
        void this.countdownText.offsetWidth; // Trigger reflow for animation restart
        this.countdownText.classList.add(currentStep === 4 ? 'go-pulse' : 'pulse-num');
      }

      // Play Beep Audio
      if (this.soundEngine && this.soundEngine.playCountdownBeep) {
        this.soundEngine.playCountdownBeep(currentStep === 4);
      }
    }
  }

  skip() {
    if (!this.isActive || this.isMultiplayer) return;
    if (this.timer < 3.2) {
      // Jump directly to countdown
      this.timer = 3.2;
      this.whooshTriggered = true;
      if (this.titleCard) this.titleCard.classList.add('fade-out');
    } else {
      // If already in countdown, jump to finish
      this.finish();
    }
  }

  finish() {
    if (!this.isActive) return;
    this.isActive = false;

    this._hideCinematicUI();

    if (this.onCompleteCallback) {
      this.onCompleteCallback();
      this.onCompleteCallback = null;
    }
  }

  _showCinematicUI() {
    if (this.overlay) this.overlay.classList.remove('hidden');
    if (this.letterboxTop) this.letterboxTop.classList.add('active');
    if (this.letterboxBottom) this.letterboxBottom.classList.add('active');
    if (this.titleCard) {
      this.titleCard.classList.remove('hidden', 'fade-out');
      this.titleCard.classList.add('slide-in');
    }
    if (this.countdownOverlay) {
      this.countdownOverlay.classList.add('hidden');
    }
  }

  _hideCinematicUI() {
    if (this.letterboxTop) this.letterboxTop.classList.remove('active');
    if (this.letterboxBottom) this.letterboxBottom.classList.remove('active');
    if (this.titleCard) this.titleCard.classList.add('hidden');
    if (this.countdownOverlay) {
      setTimeout(() => {
        if (!this.isActive) {
          this.countdownOverlay.classList.add('hidden');
          if (this.overlay) this.overlay.classList.add('hidden');
        }
      }, 700);
    }
  }

  _easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
}
