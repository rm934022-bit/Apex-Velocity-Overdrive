/**
 * Apex Velocity: Overdrive
 * Master Engine & Racing Game Orchestrator
 * Features:
 * - Home Menu with Level Selection (Monza Day GP, Sunset Coastal, Midnight Neon)
 * - Car Customizer & Garage with Exterior Color Swatches
 * - Calibrated Real-Life V8 Supercar Physics (0-100 in 3.2s, top speed 325 km/h)
 * - Procedural Day / Sunset / Night IBL Reflection Environments & PCFSoftShadowMap
 * - In-Game Pause System & Complete Race Progression with Star Ratings
 */

import * as THREE from 'three';
import { SoundEngine } from './audio/SoundEngine.js';
import { CarModelBuilder } from './cars/CarModelBuilder.js';
import { VehiclePhysics } from './cars/VehiclePhysics.js';
import { AICarController } from './cars/AICarController.js';
import { TrackBuilder } from './track/TrackBuilder.js';
import { CheckpointSystem } from './track/CheckpointSystem.js';
import { LevelManager } from './levels/LevelManager.js';
import { UIManager } from './ui/UIManager.js';
import { TireSmokeSystem } from './effects/TireSmokeSystem.js';
import { CrashSparksSystem } from './effects/CrashSparksSystem.js';

class RacingGame {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Subsystems
    this.soundEngine = null;
    this.trackBuilder = null;
    this.checkpointSystem = null;
    this.levelManager = null;
    this.uiManager = null;
    this.tireSmoke = null;
    this.crashSparks = null;
    this.crashShake = 0;

    // Lighting References for Dynamic Atmospheres
    this.sunLight = null;
    this.ambientLight = null;
    this.hemiLight = null;
    this.pmremGen = null;
    this.currentEnvRT = null;

    // Player Car & Assembly
    this.playerCarData = CarModelBuilder.CAR_DEFINITIONS[0];
    this.playerAssembly = null;
    this.playerPhysics = null;

    // AI Rivals
    this.aiRacers = [];

    // Game States: 'MENU', 'RACING', 'PAUSED', 'FINISHED'
    this.gameState = 'MENU';
    this.menuOrbitAngle = 0;

    // Camera Modes: 'CHASE', 'HOOD'
    this.cameraMode = 'CHASE';
    this.cameraYaw = 0;
    this.smoothedLookAt = new THREE.Vector3();

    // Input State
    this.input = { forward: 0, steer: 0, handbrake: false, boost: false };

    // Timing
    this.lastTime = performance.now();
    this.audioStarted = false;
  }

  async start() {
    // 1. Initialize Scene & Perspective Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);

    // 2. High-Performance Three.js Renderer with ACESFilmic Tone Mapping & Soft PCF Shadows
    const container = document.getElementById('canvas-container');
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);

    this.pmremGen = new THREE.PMREMGenerator(this.renderer);
    this.pmremGen.compileEquirectangularShader();

    // Resize listener
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 3. Level Manager (Loads persistent progress, unlocks & stars)
    this.levelManager = new LevelManager();

    // 4. Track Builder & Circuit
    this.trackBuilder = new TrackBuilder(this.scene);
    this.trackBuilder.buildCircuit();

    // 5. Audio Engine
    this.soundEngine = new SoundEngine();

    // 6. Dynamic Tire Smoke & Crash Sparks Systems
    this.tireSmoke = new TireSmokeSystem(this.scene);
    this.crashSparks = new CrashSparksSystem(this.scene);

    // 7. Checkpoint System (Configured with current level laps)
    const currentLevel = this.levelManager.getCurrentLevel();
    this.checkpointSystem = new CheckpointSystem(this.trackBuilder.getTrackSpline(), currentLevel.laps);

    // 8. Initialize Lighting & Atmospheric Environment Preset
    this._setupLightingNodes();
    this._applyAtmosphereForLevel(currentLevel);

    // 9. Build Player Car with saved color
    const savedColor = this.levelManager.getCarColor();
    this._spawnPlayerCar(this.playerCarData, savedColor, 'none');

    // 9. Build Rival Supercar (Calibrated to current level)
    this._spawnAIRivals(currentLevel);

    // 10. UI Manager (Binds Home Menu, Level Cards, Swatches, Pause System & HUD)
    this.uiManager = new UIManager(this.soundEngine, this.levelManager, {
      onStartRace: (levelId) => {
        this.startRaceWithLevel(levelId);
      },
      onSelectLevel: (levelId) => {
        const lvl = this.levelManager.getLevel(levelId);
        this.trackBuilder.buildCircuit(levelId);
        this._applyAtmosphereForLevel(lvl);
        this._alignCarToCurrentTrackStart();
      },
      onColorChange: (colorHex) => {
        this.changePlayerCarColor(colorHex);
      },
      onToggleCamera: () => {
        this.cameraMode = this.cameraMode === 'CHASE' ? 'HOOD' : 'CHASE';
      },
      onResetCar: () => {
        this._resetCarToTrack();
      },
      onPauseRace: () => {
        this.gameState = 'PAUSED';
        if (this.soundEngine) {
          if (this.soundEngine.updateWind) this.soundEngine.updateWind(0);
          if (this.soundEngine.setTireScreech) this.soundEngine.setTireScreech(0);
          if (this.soundEngine.setBarrierScrape) this.soundEngine.setBarrierScrape(0);
        }
      },
      onResumeRace: () => {
        this.gameState = 'RACING';
      },
      onRestartRace: () => {
        this.startRaceWithLevel(this.levelManager.currentLevelId);
      },
      onReturnToMenu: () => {
        this.returnToHomeMenu();
      }
    });

    // 11. Initial state: Show Home Menu
    this.uiManager.showHomeMenu();

    // 12. Bind Keyboard & Pointer Controls
    this._bindInput();

    // Start Simulation Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  _setupLightingNodes() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff5e4, 2.4);
    this.sunLight.position.set(140, 200, 100);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 450;
    const d = 140;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    this.hemiLight = new THREE.HemisphereLight(0x99ccff, 0x3d7022, 0.6);
    this.scene.add(this.hemiLight);
  }

  _applyAtmosphereForLevel(level) {
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 1024;
    skyCanvas.height = 512;
    const ctx = skyCanvas.getContext('2d');

    if (level.skyPreset === 'SUNSET') {
      // 🌴 LEVEL 3: GOA COASTAL EXPRESS (KONKAN SUNSET)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 512);
      skyGrad.addColorStop(0.00, '#231245'); // Deep twilight indigo zenith
      skyGrad.addColorStop(0.32, '#a8325a'); // Rose-magenta mid sky
      skyGrad.addColorStop(0.48, '#e65c00'); // Radiant burning orange
      skyGrad.addColorStop(0.51, '#f9d423'); // Blazing golden horizon
      skyGrad.addColorStop(0.53, '#78350f'); // Low warm earth blend
      skyGrad.addColorStop(1.00, '#1c1917'); // Dark ground
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1024, 512);

      // Low setting sun corona
      const sunU = 620;
      const sunV = 235;
      const sunGlow = ctx.createRadialGradient(sunU, sunV, 4, sunU, sunV, 160);
      sunGlow.addColorStop(0.00, 'rgba(255, 255, 255, 1.0)');
      sunGlow.addColorStop(0.12, 'rgba(255, 220, 130, 0.9)');
      sunGlow.addColorStop(0.40, 'rgba(249, 115, 22, 0.5)');
      sunGlow.addColorStop(1.00, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunU, sunV, 160, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric low sunset lighting
      this.sunLight.position.set(220, 65, -80);
      this.sunLight.color.setHex(0xff7a33);
      this.sunLight.intensity = 2.6;
      this.ambientLight.color.setHex(0xffeedd);
      this.ambientLight.intensity = 0.35;
      this.hemiLight.color.setHex(0xfb923c);
      this.hemiLight.groundColor.setHex(0x381920);
      this.hemiLight.intensity = 0.55;
      this.scene.fog = new THREE.FogExp2(0xa85568, 0.00095);
      this.renderer.toneMappingExposure = 1.28;

    } else if (level.skyPreset === 'NIGHT') {
      // 🌃 LEVEL 4: MUMBAI SEA LINK BY NIGHT (BANDRA-WORLI & MARINE DRIVE)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 512);
      skyGrad.addColorStop(0.00, '#040711'); // Deep space obsidian zenith
      skyGrad.addColorStop(0.42, '#0f172a'); // Midnight navy mid sky
      skyGrad.addColorStop(0.50, '#1e1b4b'); // Horizon electric indigo glow
      skyGrad.addColorStop(0.52, '#090d16'); // Low dark horizon
      skyGrad.addColorStop(1.00, '#020617'); // Dark turf ground
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1024, 512);

      // Procedural Stars
      ctx.fillStyle = '#ffffff';
      for (let s = 0; s < 120; s++) {
        const sx = (s * 41 + 17) % 1024;
        const sy = (s * 23 + 7) % 240;
        const sRadius = 0.6 + (s % 3) * 0.45;
        ctx.beginPath();
        ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cool Moonlight & City Horizon Glow
      this.sunLight.position.set(-100, 160, -80);
      this.sunLight.color.setHex(0x7799cc);
      this.sunLight.intensity = 1.3;
      this.ambientLight.color.setHex(0x1e293b);
      this.ambientLight.intensity = 0.32;
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x020617);
      this.hemiLight.intensity = 0.45;
    } else if (level.skyPreset === 'CANYON') {
      // 🏜️ LEVEL 2: THAR DESERT RALLY (JAISALMER DUNES)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 512);
      skyGrad.addColorStop(0.00, '#1c1917'); // Dark dusty zenith
      skyGrad.addColorStop(0.35, '#78350f'); // Warm amber canyon sky
      skyGrad.addColorStop(0.48, '#d97706'); // Golden sand haze
      skyGrad.addColorStop(0.51, '#fbbf24'); // Brilliant desert horizon
      skyGrad.addColorStop(0.53, '#92400e'); // Warm sandstone low ridge
      skyGrad.addColorStop(1.00, '#451a03'); // Desert ground
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1024, 512);

      // Blazing low desert sun
      const sunU = 480;
      const sunV = 230;
      const sunGlow = ctx.createRadialGradient(sunU, sunV, 4, sunU, sunV, 170);
      sunGlow.addColorStop(0.00, 'rgba(255, 255, 255, 1.0)');
      sunGlow.addColorStop(0.15, 'rgba(254, 240, 138, 0.9)');
      sunGlow.addColorStop(0.45, 'rgba(245, 158, 11, 0.45)');
      sunGlow.addColorStop(1.00, 'rgba(180, 83, 9, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunU, sunV, 170, 0, Math.PI * 2);
      ctx.fill();

      this.sunLight.position.set(160, 90, -120);
      this.sunLight.color.setHex(0xffaa44);
      this.sunLight.intensity = 2.7;
      this.ambientLight.color.setHex(0xfef3c7);
      this.ambientLight.intensity = 0.38;
      this.hemiLight.color.setHex(0xfcd34d);
      this.hemiLight.groundColor.setHex(0x78350f);
      this.hemiLight.intensity = 0.58;
      this.scene.fog = new THREE.FogExp2(0xd97706, 0.00095);
      this.renderer.toneMappingExposure = 1.25;

    } else if (level.skyPreset === 'ALPINE') {
      // 🏔️ LEVEL 5: HIMALAYAN PASS (LADAKH KHARDUNG LA)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 512);
      skyGrad.addColorStop(0.00, '#0c2340'); // Crisp alpine dawn zenith
      skyGrad.addColorStop(0.35, '#205493'); // Pure morning blue
      skyGrad.addColorStop(0.48, '#93c5fd'); // Soft dawn mist
      skyGrad.addColorStop(0.51, '#fde68a'); // Warm sunrise rim at mountain tops
      skyGrad.addColorStop(0.53, '#475569'); // Distant slate granite peaks
      skyGrad.addColorStop(1.00, '#0f172a'); // Dark forest valley
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1024, 512);

      // Sunrise cresting the ridge
      const sunU = 780;
      const sunV = 210;
      const sunGlow = ctx.createRadialGradient(sunU, sunV, 4, sunU, sunV, 160);
      sunGlow.addColorStop(0.00, 'rgba(255, 255, 255, 1.0)');
      sunGlow.addColorStop(0.12, 'rgba(254, 243, 199, 0.88)');
      sunGlow.addColorStop(0.38, 'rgba(251, 191, 36, 0.45)');
      sunGlow.addColorStop(1.00, 'rgba(147, 197, 253, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunU, sunV, 160, 0, Math.PI * 2);
      ctx.fill();

      this.sunLight.position.set(-180, 110, 140);
      this.sunLight.color.setHex(0xffeedd);
      this.sunLight.intensity = 2.5;
      this.ambientLight.color.setHex(0xe2e8f0);
      this.ambientLight.intensity = 0.36;
      this.hemiLight.color.setHex(0x93c5fd);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.hemiLight.intensity = 0.55;
      this.scene.fog = new THREE.FogExp2(0x94a3b8, 0.0009);
      this.renderer.toneMappingExposure = 1.24;

    } else {
      // ☀️ LEVEL 1: BUDDH GP EXPRESSWAY (GREATER NOIDA / NCR)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 512);
      skyGrad.addColorStop(0.00, '#1254a6'); // Deep cerulean zenith
      skyGrad.addColorStop(0.35, '#3b8fe6'); // Vibrant daylight azure
      skyGrad.addColorStop(0.48, '#82befa'); // Soft sky blue
      skyGrad.addColorStop(0.51, '#e3effb'); // Golden atmospheric haze at horizon
      skyGrad.addColorStop(0.53, '#b8cfbc'); // Low terrain haze blend
      skyGrad.addColorStop(0.65, '#2e5b30'); // Distant green valley
      skyGrad.addColorStop(1.00, '#1a3318'); // Nadir ground
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1024, 512);

      // High Summer Sun Disk & Corona
      const sunU = ((Math.atan2(140, 100) / (Math.PI * 2) + 0.5) % 1.0) * 1024;
      const sunV = (Math.acos(200 / Math.sqrt(140 * 140 + 200 * 200 + 100 * 100)) / Math.PI) * 512;

      const sunGlow = ctx.createRadialGradient(sunU, sunV, 4, sunU, sunV, 140);
      sunGlow.addColorStop(0.00, 'rgba(255, 255, 255, 1.0)');
      sunGlow.addColorStop(0.08, 'rgba(255, 250, 220, 0.9)');
      sunGlow.addColorStop(0.25, 'rgba(255, 228, 170, 0.45)');
      sunGlow.addColorStop(0.60, 'rgba(255, 205, 130, 0.15)');
      sunGlow.addColorStop(1.00, 'rgba(255, 200, 100, 0.0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunU, sunV, 140, 0, Math.PI * 2);
      ctx.fill();

      // Soft natural cloud haze
      for (let c = 0; c < 12; c++) {
        const cx = (c * 85 + 40) % 1024;
        const cy = 175 + Math.sin(c * 2.1) * 25;
        const cloudGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 75);
        cloudGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        cloudGrad.addColorStop(0.5, 'rgba(240, 248, 255, 0.1)');
        cloudGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = cloudGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 75, 0, Math.PI * 2);
        ctx.fill();
      }

      this.sunLight.position.set(140, 200, 100);
      this.sunLight.color.setHex(0xfff5e4);
      this.sunLight.intensity = 2.4;
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 0.4;
      this.hemiLight.color.setHex(0x99ccff);
      this.hemiLight.groundColor.setHex(0x3d7022);
      this.hemiLight.intensity = 0.6;
      this.scene.fog = new THREE.FogExp2(0xcfe4f5, 0.00095);
      this.renderer.toneMappingExposure = 1.22;
    }

    const skyTexture = new THREE.CanvasTexture(skyCanvas);
    skyTexture.mapping = THREE.EquirectangularReflectionMapping;
    skyTexture.colorSpace = THREE.SRGBColorSpace;

    if (this.currentEnvRT) {
      this.currentEnvRT.dispose();
    }
    this.currentEnvRT = this.pmremGen.fromEquirectangular(skyTexture);
    this.scene.environment = this.currentEnvRT.texture;
    this.scene.background = this.currentEnvRT.texture;
  }

  _ensureAudio() {
    if (!this.audioStarted && this.soundEngine) {
      this.soundEngine.init();
      this.soundEngine.startEngine();
      if (this.gameState === 'MENU') {
        this.soundEngine.startMenuMusic();
      } else {
        this.soundEngine.startRaceMusic();
      }
      this.audioStarted = true;
    }
  }

  _spawnPlayerCar(carData, bodyColor = 0xdc2020, underglowColor = 'none') {
    if (this.playerAssembly) {
      this.scene.remove(this.playerAssembly.root);
    }

    this.playerCarData = carData;
    this.playerAssembly = CarModelBuilder.buildCar(carData.id, bodyColor, underglowColor);
    this.scene.add(this.playerAssembly.root);

    // Create Vehicle Physics with Crash Handler
    this.playerPhysics = new VehiclePhysics(carData, this.soundEngine);
    this.playerPhysics.onCrash = (crashData) => this._triggerCrashEffect(crashData);

    // Starting grid position (Lane 1, ready on track)
    this.playerPhysics.position.set(-2.8, 0, 4);
    this.playerPhysics.rotationY = 0;
    this.playerAssembly.root.position.copy(this.playerPhysics.position);
    this.playerAssembly.root.rotation.y = 0;

    // Initialize camera position behind car
    this.camera.position.set(-2.8, 2.1, -1.8);
    this.smoothedLookAt.set(-2.8, 1.1, 8.0);
    this.camera.lookAt(this.smoothedLookAt);
  }

  _triggerCrashEffect(crashData) {
    // 1. Emit burst of glowing orange sparks
    if (this.crashSparks) {
      this.crashSparks.emit(
        crashData.position,
        crashData.normal || new THREE.Vector3(0, 1, 0),
        32,
        Math.min(1.6, Math.max(0.6, crashData.speedKmh / 90))
      );
    }

    // 2. Emit smoke cloud at impact point
    if (this.tireSmoke) {
      this.tireSmoke.emit(crashData.position, new THREE.Vector3(0, 0.8, 0), 4);
    }

    // 3. Realistic camera shudder proportional to impact speed
    this.crashShake = Math.min(0.65, 0.25 + (crashData.speedKmh / 160) * 0.40);
  }

  changePlayerCarColor(hex) {
    if (this.playerAssembly) {
      const matPaint = this.playerAssembly.materials?.matPaint;
      if (matPaint) {
        matPaint.color.setHex(hex);
      }
    }
  }

  _spawnAIRivals(level) {
    const rivalColor = 0xfacc15; // Vibrant Modena Yellow Supercar
    const rivalsConfig = [
      {
        carId: 'phantom_v12',
        color: rivalColor,
        glowColor: 'none',
        startT: 0.012,
        laneOffset: 3.2,
        topSpeedKmh: level.aiTopSpeedKmh
      }
    ];

    this.aiRacers = rivalsConfig.map(cfg => {
      const ai = new AICarController(this.scene, cfg, this.trackBuilder.getTrackSpline());
      ai.setTotalLaps(level.laps);
      ai.position.set(2.8, 0, 18);
      ai.rotationY = 0;
      ai.mesh.position.copy(ai.position);
      ai.mesh.rotation.y = 0;
      return ai;
    });
  }

  startRaceWithLevel(levelId) {
    this._ensureAudio();
    this.levelManager.setLevel(levelId);
    const level = this.levelManager.getCurrentLevel();

    // 1. Rebuild circuit geometry & spline for this level
    this.trackBuilder.buildCircuit(levelId);
    const spline = this.trackBuilder.getTrackSpline();

    // 2. Apply level atmospheric lighting and sky
    this._applyAtmosphereForLevel(level);

    // 3. Configure checkpoint laps & current track spline
    this.checkpointSystem.setTrackSpline(spline, level.laps);
    this.checkpointSystem.startRace();

    // 4. Reset player vehicle on starting grid aligned with track start
    const startPt = spline.getPointAt(0);
    const tangent = spline.getTangentAt(0).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const heading = Math.atan2(tangent.x, tangent.z);

    const playerPos = startPt.clone().add(normal.clone().multiplyScalar(2.6));
    playerPos.y = 0;
    this.playerPhysics.position.copy(playerPos);
    this.playerPhysics.rotationY = heading;
    this.cameraYaw = heading;
    this.playerPhysics.speed = 0;
    this.playerPhysics.velocity.set(0, 0, 0);
    this.playerPhysics.nitro = 100;
    this.playerAssembly.root.position.copy(playerPos);
    this.playerAssembly.root.rotation.y = heading;

    // 5. Reset AI rival with level top speed and new spline
    if (this.aiRacers.length > 0) {
      const ai = this.aiRacers[0];
      ai.setTopSpeed(level.aiTopSpeedKmh);
      ai.setTrackSpline(spline);
      ai.setTotalLaps(level.laps);
      ai.reset(0.014, -2.6);
    }

    // 6. Camera setup behind car aligned with starting straight
    this.uiManager.hideHomeMenu();
    const chaseDist = 5.6;
    const chaseHeight = 2.2;
    const offset = new THREE.Vector3(
      -Math.sin(heading) * chaseDist,
      chaseHeight,
      -Math.cos(heading) * chaseDist
    );
    this.camera.position.copy(playerPos).add(offset);
    this.smoothedLookAt.copy(playerPos).add(new THREE.Vector3(
      Math.sin(heading) * 8.0,
      1.15,
      Math.cos(heading) * 8.0
    ));
    this.camera.lookAt(this.smoothedLookAt);

    this.gameState = 'RACING';
    if (this.soundEngine) {
      this.soundEngine.stopMenuMusic();
      this.soundEngine.startRaceMusic();
    }
  }

  _alignCarToCurrentTrackStart() {
    const spline = this.trackBuilder.getTrackSpline();
    if (!spline) return;
    const startPt = spline.getPointAt(0);
    const tangent = spline.getTangentAt(0).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const heading = Math.atan2(tangent.x, tangent.z);

    const playerPos = startPt.clone().add(normal.clone().multiplyScalar(2.6));
    playerPos.y = 0;
    this.playerPhysics.position.copy(playerPos);
    this.playerPhysics.rotationY = heading;
    this.cameraYaw = heading;
    this.playerPhysics.speed = 0;
    this.playerPhysics.velocity.set(0, 0, 0);
    this.playerAssembly.root.position.copy(playerPos);
    this.playerAssembly.root.rotation.y = heading;

    if (this.aiRacers.length > 0) {
      const ai = this.aiRacers[0];
      const level = this.levelManager.getCurrentLevel();
      ai.setTrackSpline(spline);
      ai.setTotalLaps(level.laps);
      ai.reset(0.014, -2.6);
    }
  }

  returnToHomeMenu() {
    this.gameState = 'MENU';
    if (this.soundEngine) {
      this.soundEngine.stopRaceMusic();
      this.soundEngine.startMenuMusic();
      if (this.soundEngine.updateWind) this.soundEngine.updateWind(0);
      if (this.soundEngine.setTireScreech) this.soundEngine.setTireScreech(0);
      if (this.soundEngine.setBarrierScrape) this.soundEngine.setBarrierScrape(0);
      if (this.soundEngine.setNitroActive) this.soundEngine.setNitroActive(false);
      if (this.soundEngine.setBrakeSound) this.soundEngine.setBrakeSound(0, 0);
      if (this.soundEngine.updateEngine) this.soundEngine.updateEngine(0, 0, 0);
    }
    this._alignCarToCurrentTrackStart();
    this.uiManager.showHomeMenu();
  }

  _bindInput() {
    const onFirstUserAction = () => {
      this._ensureAudio();
      window.removeEventListener('keydown', onFirstUserAction);
      window.removeEventListener('pointerdown', onFirstUserAction);
    };
    window.addEventListener('keydown', onFirstUserAction);
    window.addEventListener('pointerdown', onFirstUserAction);

    const activeKeys = {};

    const syncInputFromKeys = () => {
      let fwd = 0;
      if (activeKeys['KeyW'] || activeKeys['ArrowUp']) fwd += 1;
      if (activeKeys['KeyS'] || activeKeys['ArrowDown']) fwd -= 1;
      this.input.forward = fwd;

      let str = 0;
      if (activeKeys['KeyA'] || activeKeys['ArrowLeft']) str -= 1; // Left (-1)
      if (activeKeys['KeyD'] || activeKeys['ArrowRight']) str += 1; // Right (+1)
      this.input.steer = str;

      this.input.handbrake = Boolean(activeKeys['Space']);
      this.input.boost = Boolean(activeKeys['ShiftLeft'] || activeKeys['ShiftRight']);
    };

    window.addEventListener('keydown', (e) => {
      this._ensureAudio();
      activeKeys[e.code] = true;
      syncInputFromKeys();

      // Pause / Menu Toggle (Escape)
      if (e.code === 'Escape') {
        if (this.gameState === 'RACING') {
          this.uiManager.openPauseMenu();
        } else if (this.gameState === 'PAUSED') {
          this.uiManager.closePauseMenu();
          this.gameState = 'RACING';
        }
      }

      // Camera Toggle (C)
      if (e.code === 'KeyC') {
        this.cameraMode = this.cameraMode === 'CHASE' ? 'HOOD' : 'CHASE';
        if (this.soundEngine) this.soundEngine.playTone(850, 'sine', 0.08, 0.2);
      }

      // Reset Car (R)
      if (e.code === 'KeyR') {
        this._resetCarToTrack();
      }
    });

    window.addEventListener('keyup', (e) => {
      activeKeys[e.code] = false;
      syncInputFromKeys();
    });

    window.addEventListener('blur', () => {
      for (const k in activeKeys) activeKeys[k] = false;
      syncInputFromKeys();
    });
  }

  _resetCarToTrack() {
    const info = this.trackBuilder.getClosestTrackInfo(this.playerPhysics.position);

    if (this.trackBuilder.spline) {
      const t = info.index / this.trackBuilder.sampleCount;
      const tangent = this.trackBuilder.spline.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const pos = info.closestPoint.clone().add(normal.multiplyScalar(2.5));
      this.playerPhysics.position.copy(pos);
      this.playerPhysics.position.y = 0;
      this.playerPhysics.rotationY = Math.atan2(tangent.x, tangent.z);
      this.cameraYaw = this.playerPhysics.rotationY;
    } else {
      this.playerPhysics.position.copy(info.closestPoint);
      this.playerPhysics.position.y = 0;
    }

    this.playerPhysics.speed = 0;
    this.playerPhysics.velocity.set(0, 0, 0);
    this.playerPhysics.steerAngle = 0;
    this.playerPhysics.isDrifting = false;
    this.playerAssembly.root.position.copy(this.playerPhysics.position);
    this.playerAssembly.root.rotation.y = this.playerPhysics.rotationY;

    if (this.soundEngine) this.soundEngine.playTone(440, 'sine', 0.15, 0.35);
  }

  loop(currentTime) {
    let delta = (currentTime - this.lastTime) * 0.001;
    this.lastTime = currentTime;
    delta = Math.min(delta, 0.1);

    if (this.gameState === 'MENU') {
      // Smooth Showcase Orbit Camera in Home Menu
      this.menuOrbitAngle += delta * 0.35;
      const orbitRadius = 6.4;
      const orbitHeight = 2.1 + Math.sin(this.menuOrbitAngle * 0.7) * 0.35;
      const carPos = this.playerPhysics.position;

      this.camera.position.set(
        carPos.x + Math.sin(this.menuOrbitAngle) * orbitRadius,
        carPos.y + orbitHeight,
        carPos.z + Math.cos(this.menuOrbitAngle) * orbitRadius
      );
      this.camera.lookAt(carPos.x, carPos.y + 0.9, carPos.z);

    } else if (this.gameState === 'RACING') {
      // 1. Update Player Vehicle Physics
      this.playerPhysics.update(delta, this.input, this.trackBuilder);

      // 2. Animate Car Visuals
      this._updateCarVisuals(delta);

      // 3. Update AI Rival with track synchronization
      this.aiRacers.forEach(ai => {
        ai.update(delta, this.playerPhysics.position, this.trackBuilder);
      });

      // 4. Car-to-Car Physical Collisions (Player vs Rival)
      this._checkCarCollisions();

      // 5. Aerodynamic Drafting & Slipstream Effect
      this._handleDrafting(delta);

      // 6. Dynamic 3D Tire Smoke when Drifting or Hard Braking
      if (this.tireSmoke) {
        const isDrifting = this.playerPhysics.isDrifting;
        const isHardBraking = (this.input.forward < 0 || this.input.handbrake) && this.playerPhysics.speed > 8.0;

        if (isDrifting || isHardBraking) {
          const rotY = this.playerPhysics.rotationY;
          const carPos = this.playerPhysics.position;
          const backX = -Math.sin(rotY) * 1.35;
          const backZ = -Math.cos(rotY) * 1.35;
          const sideX = Math.cos(rotY) * 0.95;
          const sideZ = -Math.sin(rotY) * 0.95;

          const rlPos = new THREE.Vector3(carPos.x + backX - sideX, 0.15, carPos.z + backZ - sideZ);
          const rrPos = new THREE.Vector3(carPos.x + backX + sideX, 0.15, carPos.z + backZ + sideZ);

          this.tireSmoke.emit(rlPos, this.playerPhysics.velocity, 2);
          this.tireSmoke.emit(rrPos, this.playerPhysics.velocity, 2);
        }
        this.tireSmoke.update(delta, this.camera);
      }

      // Update Crash Sparks & Decay Screen Shake
      if (this.crashSparks) this.crashSparks.update(delta, this.camera);
      if (this.crashShake > 0) {
        this.crashShake = Math.max(0, this.crashShake - delta * 3.0);
      }

      // 7. Checkpoint & Lap System
      const raceData = this.checkpointSystem.update(
        delta,
        this.playerPhysics.position,
        this.playerPhysics,
        this.aiRacers,
        this.trackBuilder
      );

      // 8. Update HUD
      this.uiManager.updateHUD(this.playerPhysics, raceData);

      // 9. Check Race Finish
      if (raceData && raceData.raceFinished) {
        this.gameState = 'FINISHED';
        if (this.soundEngine) this.soundEngine.stopRaceMusic();
        this.aiRacers.forEach(ai => ai.stopCar());

        const levelResult = this.levelManager.recordRaceResult(
          this.levelManager.currentLevelId,
          raceData.position,
          this.checkpointSystem.totalRaceTime,
          this.checkpointSystem.formatTime(this.checkpointSystem.totalRaceTime)
        );

        this.uiManager.showResults({
          position: raceData.position,
          totalTime: this.checkpointSystem.formatTime(this.checkpointSystem.totalRaceTime),
          bestLapTime: raceData.bestLapTime
        }, levelResult);
      }

      // 10. Update Camera
      this._updateCamera(delta);
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame((t) => this.loop(t));
  }

  _checkCarCollisions() {
    if (!this.playerPhysics || !this.aiRacers.length) return;
    const playerPos = this.playerPhysics.position;

    this.aiRacers.forEach(ai => {
      const deltaVec = playerPos.clone().sub(ai.position);
      deltaVec.y = 0;
      const dist = deltaVec.length();
      const minDistance = 2.45; // Physical contact bumper boundary

      if (dist < minDistance && dist > 0.001) {
        const overlap = (minDistance - dist);
        const normal = deltaVec.clone().divideScalar(dist);

        // Push vehicles apart along impact normal
        this.playerPhysics.position.add(normal.clone().multiplyScalar(overlap * 0.55));
        ai.position.sub(normal.clone().multiplyScalar(overlap * 0.55));

        // Physics momentum exchange & stopping
        const relSpeed = this.playerPhysics.speed - ai.speed;
        const impactForce = Math.abs(relSpeed);

        if (impactForce > 3.5) {
          // Hard car-to-car collision: decelerate realistically while preserving forward momentum
          this.playerPhysics.speed = Math.max(8.0, this.playerPhysics.speed - relSpeed * 0.35);
          ai.speed = Math.max(8.0, ai.speed + relSpeed * 0.30);

          // Sparks and crash impact effects
          const contactPt = playerPos.clone().add(ai.position).multiplyScalar(0.5);
          this._triggerCrashEffect({
            speedKmh: Math.round(impactForce * 3.6),
            position: contactPt,
            normal: normal
          });

          if (this.soundEngine) {
            this.soundEngine.playCrash(Math.min(1.0, impactForce / 22));
          }
        } else {
          // Side contact / rubbing
          this.playerPhysics.speed -= relSpeed * 0.12;
          ai.speed += relSpeed * 0.10;
        }

        // Steering bump deflection
        this.playerPhysics.steerAngle += (Math.random() - 0.5) * 0.08;
      }
    });
  }

  _handleDrafting(delta) {
    if (!this.playerPhysics || !this.aiRacers.length) return;
    const playerPos = this.playerPhysics.position;
    const ai = this.aiRacers[0];
    const dist = playerPos.distanceTo(ai.position);

    // Slipstream suction zone: between 4m and 18m behind opponent car
    if (dist > 4.0 && dist < 18.0 && this.playerPhysics.speed > 25.0) {
      const toAi = ai.position.clone().sub(playerPos);
      const forward = new THREE.Vector3(Math.sin(this.playerPhysics.rotationY), 0, Math.cos(this.playerPhysics.rotationY));
      const dot = forward.dot(toAi.normalize());

      if (dot > 0.86) {
        // Reduced drag & +10% power suction in rival's wake
        this.playerPhysics.speed += 3.5 * delta;
        if (this.uiManager?.speedLines) {
          this.uiManager.speedLines.style.opacity = '0.45';
        }
      }
    }
  }

  _updateCarVisuals(delta) {
    if (!this.playerAssembly || !this.playerPhysics) return;
    const root = this.playerAssembly.root;

    // Position & Yaw
    root.position.copy(this.playerPhysics.position);
    root.rotation.y = this.playerPhysics.rotationY;

    // Body Roll & Pitch
    root.rotation.z = this.playerPhysics.chassisRoll || 0;
    root.rotation.x = this.playerPhysics.chassisPitch || 0;

    // Animate Wheel Rotation & Steer
    const wheelRot = (this.playerPhysics.speed * delta) / 0.38;
    const wheels = this.playerAssembly.wheels;

    if (wheels) {
      if (wheels.fl?.rotatingMesh) wheels.fl.rotatingMesh.rotation.x += wheelRot;
      if (wheels.fr?.rotatingMesh) wheels.fr.rotatingMesh.rotation.x += wheelRot;
      if (wheels.rl?.rotatingMesh) wheels.rl.rotatingMesh.rotation.x += wheelRot;
      if (wheels.rr?.rotatingMesh) wheels.rr.rotatingMesh.rotation.x += wheelRot;

      if (wheels.fl?.pivot) wheels.fl.pivot.rotation.y = this.playerPhysics.steerAngle;
      if (wheels.fr?.pivot) wheels.fr.pivot.rotation.y = this.playerPhysics.steerAngle;
    }

    // Nitro Exhaust Flames
    if (this.playerAssembly.exhaustFlames) {
      this.playerAssembly.exhaustFlames.forEach(f => {
        f.visible = this.playerPhysics.isBoosting;
      });
    }

    // Taillights
    const isBraking = this.input.forward < 0 || this.input.handbrake;
    const matTail = this.playerAssembly.materials?.matTaillight || this.playerAssembly.materials?.matRoundTaillight;
    if (matTail) {
      matTail.color.setHex(isBraking ? 0xff0022 : 0x880015);
    }
  }

  _updateCamera(delta) {
    const carPos = this.playerPhysics.position;
    const speed = this.playerPhysics.getSpeedKmh();

    if (this.cameraMode === 'CHASE') {
      const targetFov = 65 + Math.min(20, (speed / 280) * 20) + (this.playerPhysics.isBoosting ? 8 : 0);
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 8.0);
      this.camera.updateProjectionMatrix();

      let angleDiff = this.playerPhysics.rotationY - this.cameraYaw;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      this.cameraYaw += angleDiff * Math.min(1.0, delta * 8.5);

      const speedRatio = Math.min(1.0, speed / 300);
      const chaseDist = 5.6 + speedRatio * 1.6;
      const chaseHeight = 2.2 + speedRatio * 0.35;

      const offset = new THREE.Vector3(
        -Math.sin(this.cameraYaw) * chaseDist,
        chaseHeight,
        -Math.cos(this.cameraYaw) * chaseDist
      );

      const baseShake = (this.playerPhysics.isBoosting ? 0.08 : (this.playerPhysics.isDrifting ? 0.04 : 0));
      const totalShake = baseShake + (this.crashShake > 0.01 ? this.crashShake * 0.42 : 0);
      if (totalShake > 0) {
        offset.x += (Math.random() - 0.5) * totalShake;
        offset.y += (Math.random() - 0.5) * totalShake * 0.6;
        offset.z += (Math.random() - 0.5) * totalShake * 0.8;
      }

      const desiredPos = carPos.clone().add(offset);
      this.camera.position.lerp(desiredPos, Math.min(1.0, delta * 10.0));

      const steerLookAhead = -this.playerPhysics.steerAngle * 3.5;
      const lookDist = 7.0 + speedRatio * 8.0;
      const lookTarget = carPos.clone().add(new THREE.Vector3(
        Math.sin(this.playerPhysics.rotationY) * lookDist + Math.cos(this.playerPhysics.rotationY) * steerLookAhead,
        1.15,
        Math.cos(this.playerPhysics.rotationY) * lookDist - Math.sin(this.playerPhysics.rotationY) * steerLookAhead
      ));

      this.smoothedLookAt.lerp(lookTarget, Math.min(1.0, delta * 14.0));
      this.camera.lookAt(this.smoothedLookAt);

    } else if (this.cameraMode === 'HOOD') {
      const rotY = this.playerPhysics.rotationY;
      const hoodOffset = new THREE.Vector3(
        Math.sin(rotY) * 0.9,
        0.92,
        Math.cos(rotY) * 0.9
      );
      this.camera.position.copy(carPos).add(hoodOffset);

      const lookAhead = carPos.clone().add(new THREE.Vector3(
        Math.sin(rotY) * 20,
        0.8,
        Math.cos(rotY) * 20
      ));
      this.camera.lookAt(lookAhead);

      this.camera.fov = 76 + (this.playerPhysics.isBoosting ? 10 : 0);
      this.camera.updateProjectionMatrix();
    }
  }
}

// Bootstrap Game
window.addEventListener('DOMContentLoaded', () => {
  const game = new RacingGame();
  game.start().catch(err => console.error('Racing game init error:', err));
});
