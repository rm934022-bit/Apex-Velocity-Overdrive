/**
 * Apex Velocity: Overdrive
 * High-Fidelity Hybrid Audio Engine
 *
 * Integrates:
 * 1. Real Automotive Engine Sample (city-car-acceleration-inside-car-7087 / car_engine.mp3)
 *    - Dynamic continuous playbackRate pitch scaling tracking RPM, gears, and road speed
 *    - Dynamic throttle response: full-throttle roar vs coasting overrun
 *    - High-performance carbon-ceramic brake disc friction & rotor scrub
 * 2. High-Energy Nitrous Oxide Boost System
 *    - Solenoid ignition boom + high-pressure nitrous gas purge hiss + turbine overdrive roar
 * 3. Dual-Clutch Ignition-Cut Gearshift Pops (PDK / F1-DCT crackle)
 * 4. Aerodynamic High-Speed Wind Rush (smoothly scaled with speed)
 * 5. Multi-layer Asphalt Tire Drift Scrub
 * 6. Guardrail Scraping & Kinetic Crash Crunches
 * 7. Polished Minimalist UI Chimes
 */

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    this.initialized = false;

    // Load persisted settings
    this.settings = this._loadAudioSettings();
    this.masterVolume = this.settings.masterVolume;
    this.musicVolume = this.settings.musicVolume;
    this.sfxVolume = this.settings.sfxVolume;
    this.isMusicEnabled = this.settings.musicEnabled;
    this.isSFXEnabled = this.settings.sfxEnabled;
    this.isMuted = this.settings.isMuted;

    // --- Sample Engine State ---
    this.engineSampleBuffer = null;
    this.sampleSource = null;
    this.sampleFilter = null;
    this.sampleGain = null;
    this.isEngineRunning = false;

    // --- Procedural Reinforcement Layers ---
    this.engineMasterGain = null;
    this.engineSubOsc = null;
    this.engineSubGain = null;
    this.engineWarmthFilter = null;
    this.saturationNode = null;

    // --- Nitrous Oxide Boost State ---
    this.isNitroActive = false;
    this.nitroLoopSource = null;
    this.nitroLoopFilter = null;
    this.nitroLoopGain = null;

    // --- Brake Friction Sound ---
    this.brakeSource = null;
    this.brakeFilter = null;
    this.brakeGain = null;

    // --- Tire Screech / Drift Scrub ---
    this.screechSource = null;
    this.screechScrubFilter = null;
    this.screechSquealFilter = null;
    this.screechGain = null;

    // --- Aerodynamic High-Speed Wind Rush ---
    this.windSource = null;
    this.windFilter = null;
    this.windGain = null;

    // --- Guardrail Barrier Grind ---
    this.scrapeSource = null;
    this.scrapeFilter = null;
    this.scrapeGain = null;

    // Overrun tracking
    this.lastThrottle = 0;
    this.lastOverrunTime = 0;

    // Music Sequencer State
    this.isMusicPlaying = false;
    this.musicStep = 0;
    this.musicTempo = 135;
    this.musicTimer = null;

    this.isMenuMusicPlaying = false;
    this.menuMusicTimer = null;
    this.menuStep = 0;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      const initialMaster = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.setValueAtTime(initialMaster, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      const initialSfx = this.isSFXEnabled ? this.sfxVolume : 0;
      this.sfxGain.gain.setValueAtTime(initialSfx, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Gain
      this.musicGain = this.ctx.createGain();
      const initialMusic = this.isMusicEnabled ? this.musicVolume : 0;
      this.musicGain.gain.setValueAtTime(initialMusic, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // Warm Analog Saturation WaveShaper
      this.saturationNode = this.ctx.createWaveShaper();
      this.saturationNode.curve = this._createWarmSaturationCurve(2048);
      this.saturationNode.oversample = '2x';
      this.saturationNode.connect(this.sfxGain);

      // Initialize persistent noise loops (dormant until activated)
      this._initTireScreech();
      this._initWindRush();
      this._initBarrierScrape();
      this._initBrakeSound();
      this._initNitroLoop();

      // Asynchronously load real recorded car audio sample
      this._loadEngineAudioSample();

      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext pending user interaction:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _createWarmSaturationCurve(samples = 2048) {
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh(1.5 * x);
    }
    return curve;
  }

  _createNoiseBuffer(seconds = 2.0) {
    const bufferSize = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.1614264;
      b2 = 0.57000 * b2 + white * 0.4626556;
      data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.22;
    }
    return buffer;
  }

  async _loadEngineAudioSample() {
    if (!this.ctx) return;
    try {
      const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
        ? import.meta.env.BASE_URL
        : '/';
      const audioUrl = `${baseUrl.replace(/\/$/, '')}/audio/car_engine.mp3`.replace('//', '/');

      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      this.engineSampleBuffer = await this.ctx.decodeAudioData(arrayBuffer);

      // If engine was already started prior to download completion, attach sample now
      if (this.isEngineRunning && !this.sampleSource) {
        this._startSampleLayer();
      }
    } catch (e) {
      console.warn('Real car engine sample loading fallback:', e);
    }
  }

  // ===========================================================================
  // 1. ENGINE AUDIO SYSTEM (REAL RECORDING + SUB-BASS REINFORCEMENT)
  // ===========================================================================
  startEngine() {
    if (!this.ctx || this.isEngineRunning) return;
    this.resume();

    const now = this.ctx.currentTime;

    // Master Engine Bus
    this.engineMasterGain = this.ctx.createGain();
    this.engineMasterGain.gain.setValueAtTime(0.01, now);
    this.engineMasterGain.gain.linearRampToValueAtTime(0.85, now + 0.2);
    this.engineMasterGain.connect(this.sfxGain);

    // Procedural Sub-Bass Mechanical Rumble (Chest-thumping 28 - 120 Hz)
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'triangle';
    this.engineSubOsc.frequency.setValueAtTime(32, now);

    this.engineSubGain = this.ctx.createGain();
    this.engineSubGain.gain.setValueAtTime(0.35, now);

    this.engineWarmthFilter = this.ctx.createBiquadFilter();
    this.engineWarmthFilter.type = 'lowpass';
    this.engineWarmthFilter.frequency.setValueAtTime(140, now);

    this.engineSubOsc.connect(this.engineWarmthFilter);
    this.engineWarmthFilter.connect(this.engineSubGain);
    this.engineSubGain.connect(this.engineMasterGain);
    this.engineSubOsc.start(now);

    this.isEngineRunning = true;

    // Start Sample Layer if already loaded
    if (this.engineSampleBuffer) {
      this._startSampleLayer();
    }
  }

  _startSampleLayer() {
    if (!this.ctx || !this.engineSampleBuffer) return;
    try {
      const now = this.ctx.currentTime;
      this.sampleSource = this.ctx.createBufferSource();
      this.sampleSource.buffer = this.engineSampleBuffer;
      this.sampleSource.loop = true;
      this.sampleSource.playbackRate.setValueAtTime(0.72, now);

      this.sampleFilter = this.ctx.createBiquadFilter();
      this.sampleFilter.type = 'lowpass';
      this.sampleFilter.frequency.setValueAtTime(1100, now);
      this.sampleFilter.Q.setValueAtTime(0.9, now);

      this.sampleGain = this.ctx.createGain();
      this.sampleGain.gain.setValueAtTime(0.55, now);

      this.sampleSource.connect(this.sampleFilter);
      this.sampleFilter.connect(this.sampleGain);
      this.sampleGain.connect(this.engineMasterGain);

      this.sampleSource.start(now);
    } catch (e) {
      console.warn('Error starting sample layer:', e);
    }
  }

  updateEngine(rpmRatio, throttle, speedKmh = 0) {
    if (!this.isEngineRunning || !this.ctx) return;

    const now = this.ctx.currentTime;
    const clampedRpm = Math.max(0, Math.min(1.0, rpmRatio));
    const absSpeed = Math.abs(speedKmh);

    // =========================================================================
    // A. Real Recorded Engine Sample Pitch & Frequency Modulation
    // =========================================================================
    if (this.sampleSource && this.sampleGain && this.sampleFilter) {
      if (throttle > 0) {
        // --- 1. ACCELERATION ---
        // Pitch rises realistically with RPM and speed (idle 0.72 -> redline 1.80, with nitro up to 2.15)
        const nitroBonus = this.isNitroActive ? 0.32 : 0;
        const targetRate = 0.72 + Math.pow(clampedRpm, 1.15) * 0.98 + (absSpeed / 360) * 0.22 + nitroBonus;
        this.sampleSource.playbackRate.setTargetAtTime(targetRate, now, 0.04);

        // Filter opens wide on throttle: delivers the full raw engine acoustic roar
        const targetCutoff = 1100 + throttle * 3200 + clampedRpm * 4200;
        this.sampleFilter.frequency.setTargetAtTime(targetCutoff, now, 0.04);

        // Volume increases under acceleration
        const targetVol = 0.62 + throttle * 0.38 + clampedRpm * 0.20;
        this.sampleGain.gain.setTargetAtTime(targetVol, now, 0.04);

      } else if (throttle < 0) {
        // --- 2. BRAKING / REVERSING ---
        // Pitch drops quickly toward idle
        const targetRate = Math.max(0.68, 0.68 + (absSpeed / 300) * 0.42);
        this.sampleSource.playbackRate.setTargetAtTime(targetRate, now, 0.06);

        // Muffled overrun frequency
        const targetCutoff = 800 + (absSpeed / 300) * 1600;
        this.sampleFilter.frequency.setTargetAtTime(targetCutoff, now, 0.06);

        // Volume eases
        const targetVol = 0.46 + (absSpeed / 300) * 0.22;
        this.sampleGain.gain.setTargetAtTime(targetVol, now, 0.05);

      } else {
        // --- 3. COASTING / LIFT-OFF ---
        // Smooth overrun pitch
        const targetRate = Math.max(0.70, 0.70 + (absSpeed / 300) * 0.55);
        this.sampleSource.playbackRate.setTargetAtTime(targetRate, now, 0.06);

        // Engine overrun muffled filter
        const targetCutoff = 950 + (absSpeed / 300) * 1800;
        this.sampleFilter.frequency.setTargetAtTime(targetCutoff, now, 0.05);

        // Gentle coasting volume
        const targetVol = 0.42 + (absSpeed / 300) * 0.24;
        this.sampleGain.gain.setTargetAtTime(targetVol, now, 0.05);
      }
    }

    // =========================================================================
    // B. Sub-Bass Mechanical Combustion Rumble (28 - 120 Hz)
    // =========================================================================
    if (this.engineSubOsc && this.engineSubGain) {
      const subFreq = 28 + Math.pow(clampedRpm, 1.2) * 92;
      this.engineSubOsc.frequency.setTargetAtTime(subFreq, now, 0.035);
      const subVol = 0.32 + Math.max(0, throttle) * 0.22;
      this.engineSubGain.gain.setTargetAtTime(subVol, now, 0.04);
    }

    // =========================================================================
    // C. Deceleration Overrun Exhaust Pops & Burbles (On sudden lift-off)
    // =========================================================================
    if (this.lastThrottle > 0.45 && throttle <= 0.05 && clampedRpm > 0.42) {
      if (now - this.lastOverrunTime > 0.35) {
        this._triggerOverrunPop(clampedRpm);
        this.lastOverrunTime = now;
      }
    }
    this.lastThrottle = throttle;
  }

  stopEngine() {
    if (!this.isEngineRunning || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.engineMasterGain) {
      this.engineMasterGain.gain.linearRampToValueAtTime(0.001, now + 0.2);
    }

    setTimeout(() => {
      try {
        if (this.sampleSource) {
          this.sampleSource.stop();
          this.sampleSource = null;
        }
        if (this.engineSubOsc) {
          this.engineSubOsc.stop();
          this.engineSubOsc = null;
        }
      } catch (e) {}
      this.isEngineRunning = false;
    }, 240);
  }

  _triggerOverrunPop(rpm) {
    if (!this.ctx) return;
    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const delay = i * (0.07 + Math.random() * 0.06);
      const popTime = this.ctx.currentTime + delay;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(135 + Math.random() * 45, popTime);
      osc.frequency.exponentialRampToValueAtTime(32, popTime + 0.05);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(360, popTime);

      gain.gain.setValueAtTime(0.26 * rpm, popTime);
      gain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(popTime);
      osc.stop(popTime + 0.07);
    }
  }

  // ===========================================================================
  // 2. DUAL-CLUTCH (DCT / PDK) GEAR SHIFT POP & TURBO FLUTTER
  // ===========================================================================
  playTurboBlowOff() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Dual-Clutch Ignition-Cut Exhaust Pop (Punchy sub thump)
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'triangle';
    popOsc.frequency.setValueAtTime(95, now);
    popOsc.frequency.exponentialRampToValueAtTime(28, now + 0.06);

    popGain.gain.setValueAtTime(0.48, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    popOsc.connect(popGain);
    popGain.connect(this.sfxGain);
    popOsc.start(now);
    popOsc.stop(now + 0.08);

    // Silky Turbo Wastegate Flutter
    try {
      const buffer = this._createNoiseBuffer(0.18);
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1450, now);
      filter.frequency.exponentialRampToValueAtTime(720, now + 0.16);
      filter.Q.setValueAtTime(1.2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
    } catch (e) {}
  }

  // ===========================================================================
  // 3. CARBON-CERAMIC BRAKE ROTOR FRICTION & SQUEAL
  // ===========================================================================
  _initBrakeSound() {
    if (!this.ctx) return;
    try {
      const buffer = this._createNoiseBuffer(2.5);
      this.brakeSource = this.ctx.createBufferSource();
      this.brakeSource.buffer = buffer;
      this.brakeSource.loop = true;

      this.brakeFilter = this.ctx.createBiquadFilter();
      this.brakeFilter.type = 'bandpass';
      this.brakeFilter.frequency.setValueAtTime(1850, this.ctx.currentTime);
      this.brakeFilter.Q.setValueAtTime(2.4, this.ctx.currentTime);

      this.brakeGain = this.ctx.createGain();
      this.brakeGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.brakeSource.connect(this.brakeFilter);
      this.brakeFilter.connect(this.brakeGain);
      this.brakeGain.connect(this.sfxGain);

      this.brakeSource.start();
    } catch (e) {}
  }

  setBrakeSound(intensity, speedKmh = 0) {
    if (!this.brakeGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    const absSpeed = Math.abs(speedKmh);

    // Only audible when moving fast enough (> 25 km/h) and applying brakes
    if (absSpeed < 25 || intensity <= 0.05) {
      this.brakeGain.gain.setTargetAtTime(0, now, 0.08);
      return;
    }

    const speedFactor = Math.min(1.0, (absSpeed - 25) / 120);
    const targetVol = Math.min(0.42, intensity * speedFactor * 0.38);
    this.brakeGain.gain.setTargetAtTime(targetVol, now, 0.06);

    // Squeal pitch varies with speed
    const targetFreq = 1600 + speedFactor * 800;
    this.brakeFilter.frequency.setTargetAtTime(targetFreq, now, 0.06);
  }

  // ===========================================================================
  // 4. POWERFUL NITROUS OXIDE BOOST AUDIO SYSTEM
  // ===========================================================================
  _initNitroLoop() {
    if (!this.ctx) return;
    try {
      const buffer = this._createNoiseBuffer(3.0);
      this.nitroLoopSource = this.ctx.createBufferSource();
      this.nitroLoopSource.buffer = buffer;
      this.nitroLoopSource.loop = true;

      this.nitroLoopFilter = this.ctx.createBiquadFilter();
      this.nitroLoopFilter.type = 'bandpass';
      this.nitroLoopFilter.frequency.setValueAtTime(1150, this.ctx.currentTime);
      this.nitroLoopFilter.Q.setValueAtTime(1.4, this.ctx.currentTime);

      this.nitroLoopGain = this.ctx.createGain();
      this.nitroLoopGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.nitroLoopSource.connect(this.nitroLoopFilter);
      this.nitroLoopFilter.connect(this.nitroLoopGain);
      this.nitroLoopGain.connect(this.sfxGain);

      this.nitroLoopSource.start();
    } catch (e) {}
  }

  setNitroActive(active) {
    this.isNitroActive = active;
    if (!this.nitroLoopGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    const targetVol = active ? 0.38 : 0;
    this.nitroLoopGain.gain.setTargetAtTime(targetVol, now, 0.08);
  }

  playNitroRoar() {
    if (!this.ctx) return;
    this.setNitroActive(true);
    const now = this.ctx.currentTime;

    // 1. Initial Nitrous Solenoid Ignition Explosion (Sub boom)
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'triangle';
    boom.frequency.setValueAtTime(85, now);
    boom.frequency.exponentialRampToValueAtTime(28, now + 0.38);

    boomGain.gain.setValueAtTime(0.68, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    boom.connect(boomGain);
    boomGain.connect(this.sfxGain);
    boom.start(now);
    boom.stop(now + 0.45);

    // 2. High-Pressure Nitrous Gas Purge Jet Whoosh
    try {
      const buffer = this._createNoiseBuffer(0.55);
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1350, now);
      filter.frequency.exponentialRampToValueAtTime(620, now + 0.5);
      filter.Q.setValueAtTime(1.8, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.52, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
    } catch (e) {}
  }

  // ===========================================================================
  // 5. AERODYNAMIC HIGH-SPEED WIND RUSH
  // ===========================================================================
  _initWindRush() {
    if (!this.ctx) return;
    try {
      const buffer = this._createNoiseBuffer(3.0);
      this.windSource = this.ctx.createBufferSource();
      this.windSource.buffer = buffer;
      this.windSource.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.setValueAtTime(650, this.ctx.currentTime);
      this.windFilter.Q.setValueAtTime(0.75, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.windSource.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.sfxGain);

      this.windSource.start();
    } catch (e) {}
  }

  updateWind(speedKmh) {
    if (!this.windGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    const absSpeed = Math.abs(speedKmh);

    if (absSpeed < 55) {
      this.windGain.gain.setTargetAtTime(0.0, now, 0.08);
      return;
    }

    const ratio = Math.min(1.0, (absSpeed - 55) / 250);
    const targetVol = ratio * 0.28;
    const targetFreq = 580 + ratio * 450;

    this.windGain.gain.setTargetAtTime(targetVol, now, 0.06);
    this.windFilter.frequency.setTargetAtTime(targetFreq, now, 0.06);
  }

  // ===========================================================================
  // 6. REALISTIC ASPHALT TIRE DRIFT SCRUB & SQUEAL
  // ===========================================================================
  _initTireScreech() {
    if (!this.ctx) return;
    try {
      const buffer = this._createNoiseBuffer(2.5);
      this.screechSource = this.ctx.createBufferSource();
      this.screechSource.buffer = buffer;
      this.screechSource.loop = true;

      this.screechScrubFilter = this.ctx.createBiquadFilter();
      this.screechScrubFilter.type = 'bandpass';
      this.screechScrubFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.screechScrubFilter.Q.setValueAtTime(1.1, this.ctx.currentTime);

      this.screechSquealFilter = this.ctx.createBiquadFilter();
      this.screechSquealFilter.type = 'bandpass';
      this.screechSquealFilter.frequency.setValueAtTime(1380, this.ctx.currentTime);
      this.screechSquealFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

      this.screechGain = this.ctx.createGain();
      this.screechGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.screechSource.connect(this.screechScrubFilter);
      this.screechSource.connect(this.screechSquealFilter);
      this.screechScrubFilter.connect(this.screechGain);
      this.screechSquealFilter.connect(this.screechGain);
      this.screechGain.connect(this.sfxGain);

      this.screechSource.start();
    } catch (e) {}
  }

  setTireScreech(intensity) {
    if (!this.screechGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    const target = Math.min(0.42, intensity * 0.38);
    this.screechGain.gain.setTargetAtTime(target, now, 0.07);
  }

  // ===========================================================================
  // 7. METALLIC GUARDRAIL SCRAPING
  // ===========================================================================
  _initBarrierScrape() {
    if (!this.ctx) return;
    try {
      const buffer = this._createNoiseBuffer(2.0);
      this.scrapeSource = this.ctx.createBufferSource();
      this.scrapeSource.buffer = buffer;
      this.scrapeSource.loop = true;

      this.scrapeFilter = this.ctx.createBiquadFilter();
      this.scrapeFilter.type = 'bandpass';
      this.scrapeFilter.frequency.setValueAtTime(720, this.ctx.currentTime);
      this.scrapeFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.scrapeGain = this.ctx.createGain();
      this.scrapeGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.scrapeSource.connect(this.scrapeFilter);
      this.scrapeFilter.connect(this.scrapeGain);
      this.scrapeGain.connect(this.sfxGain);

      this.scrapeSource.start();
    } catch (e) {}
  }

  setBarrierScrape(intensity) {
    if (!this.scrapeGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    const target = Math.min(0.35, intensity * 0.32);
    this.scrapeGain.gain.setTargetAtTime(target, now, 0.06);
  }

  // ===========================================================================
  // 8. CRASH & IMPACT KINETIC AUDIO
  // ===========================================================================
  playImpact() {
    this.playCrash(0.65);
  }

  playCrash(intensity = 1.0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const clampedIntensity = Math.min(1.0, Math.max(0.2, intensity));

    // Heavy sub-bass kinetic body thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(70, now);
    osc.frequency.exponentialRampToValueAtTime(22, now + 0.28);

    gain.gain.setValueAtTime(0.65 * clampedIntensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.35);

    // Dense metallic crumple resonance
    try {
      const buffer = this._createNoiseBuffer(0.26);
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(680, now);
      filter.Q.setValueAtTime(1.6, now);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.52 * clampedIntensity, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);

      noise.start(now);
    } catch (e) {}
  }

  // ===========================================================================
  // 9. POLISHED MODERN MINIMALIST UI TONES & CHIMES + GTA 5 CINEMATICS
  // ===========================================================================
  playGtaWhoosh() {
    if (!this.ctx || !this.isSFXEnabled || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const duration = 1.35;

      // Filtered sweeping noise swoosh
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + duration);
      filter.Q.setValueAtTime(3.8, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.65, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Pitch-dropping air body
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + duration);

      oscGain.gain.setValueAtTime(0.001, now);
      oscGain.gain.linearRampToValueAtTime(0.4, now + 0.3);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);

      whiteNoise.start(now);
      osc.start(now);
      whiteNoise.stop(now + duration);
      osc.stop(now + duration);
    } catch (e) {}
  }

  playGtaBassDrop() {
    if (!this.ctx || !this.isSFXEnabled || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const duration = 0.85;

      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(95, now);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + duration);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.85, now + 0.04);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);

      subOsc.start(now);
      subOsc.stop(now + duration);
    } catch (e) {}
  }

  playCountdownBeep(isGo = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = isGo ? 1200 : 640;
    const duration = isGo ? 0.32 : 0.12;
    const vol = isGo ? 0.55 : 0.35;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playCheckpointChime() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playTone(980, 'sine', 0.12, 0.32, now);
    this.playTone(1470, 'sine', 0.22, 0.38, now + 0.07);
  }

  playVictoryFanfare() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.50];
    chord.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.38, 0.38, now + idx * 0.12);
    });
  }

  playTone(freq, type = 'sine', duration = 0.1, volume = 0.25, atTime = null) {
    if (!this.ctx) return;
    const now = atTime || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  startRaceMusic() {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.musicStep = 0;

    const playStep = () => {
      if (!this.isMusicPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const step16 = this.musicStep % 16;

      if (step16 === 0 || step16 === 8) {
        this._playSubKick(now);
      }

      this.musicStep++;
      const stepMs = (60 / this.musicTempo) * 250;
      this.musicTimer = setTimeout(playStep, stepMs);
    };

    playStep();
  }

  stopRaceMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) clearTimeout(this.musicTimer);
  }

  _playSubKick(time) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  // ===========================================================================
  // 10. AUDIO SETTINGS CONTROLS & PERSISTENCE
  // ===========================================================================
  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    this.saveAudioSettings();
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.isMusicEnabled ? this.musicVolume : 0, this.ctx.currentTime);
    }
    this.saveAudioSettings();
  }

  setSFXVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.isSFXEnabled ? this.sfxVolume : 0, this.ctx.currentTime);
    }
    this.saveAudioSettings();
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    this.saveAudioSettings();
  }

  setMusicEnabled(enabled) {
    this.isMusicEnabled = !!enabled;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.isMusicEnabled ? this.musicVolume : 0, this.ctx.currentTime);
    }
    if (!this.isMusicEnabled) {
      this.stopRaceMusic();
      this.stopMenuMusic();
    }
    this.saveAudioSettings();
  }

  setSFXEnabled(enabled) {
    this.isSFXEnabled = !!enabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.isSFXEnabled ? this.sfxVolume : 0, this.ctx.currentTime);
    }
    this.saveAudioSettings();
  }

  playTestAudio() {
    this.resume();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playTone(523.25, 'sine', 0.12, 0.45 * this.sfxVolume, now);
    this.playTone(659.25, 'sine', 0.16, 0.45 * this.sfxVolume, now + 0.1);
    this.playTone(783.99, 'sine', 0.22, 0.50 * this.sfxVolume, now + 0.2);
  }

  startMenuMusic() {
    if (this.isMenuMusicPlaying || !this.isMusicEnabled) return;
    this.isMenuMusicPlaying = true;
    this.menuStep = 0;

    const chords = [
      [220.0, 261.63, 329.63], // Am
      [174.61, 220.0, 261.63], // F
      [130.81, 164.81, 196.0], // C
      [196.0, 246.94, 293.66]  // G
    ];

    const playMenuStep = () => {
      if (!this.isMenuMusicPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const chordIndex = Math.floor(this.menuStep / 4) % chords.length;

      if (this.menuStep % 4 === 0) {
        chords[chordIndex].forEach(f => {
          this.playTone(f, 'sine', 0.85, 0.08 * this.musicVolume, now);
        });
      }

      this.menuStep++;
      this.menuMusicTimer = setTimeout(playMenuStep, 500);
    };

    playMenuStep();
  }

  stopMenuMusic() {
    this.isMenuMusicPlaying = false;
    if (this.menuMusicTimer) {
      clearTimeout(this.menuMusicTimer);
      this.menuMusicTimer = null;
    }
  }

  _loadAudioSettings() {
    try {
      const data = localStorage.getItem('apex_velocity_audio_settings_v1');
      if (data) {
        const parsed = JSON.parse(data);
        return {
          masterVolume: parsed.masterVolume ?? 0.85,
          musicVolume: parsed.musicVolume ?? 0.50,
          sfxVolume: parsed.sfxVolume ?? 0.90,
          musicEnabled: parsed.musicEnabled ?? true,
          sfxEnabled: parsed.sfxEnabled ?? true,
          isMuted: parsed.isMuted ?? false
        };
      }
    } catch (e) {}
    return {
      masterVolume: 0.85,
      musicVolume: 0.50,
      sfxVolume: 0.90,
      musicEnabled: true,
      sfxEnabled: true,
      isMuted: false
    };
  }

  saveAudioSettings() {
    try {
      localStorage.setItem('apex_velocity_audio_settings_v1', JSON.stringify({
        masterVolume: this.masterVolume,
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
        musicEnabled: this.isMusicEnabled,
        sfxEnabled: this.isSFXEnabled,
        isMuted: this.isMuted
      }));
    } catch (e) {}
  }
}
