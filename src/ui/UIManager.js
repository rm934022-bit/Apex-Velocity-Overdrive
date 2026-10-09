/**
 * Apex Velocity: Overdrive
 * Complete UI Orchestrator: Home Menu, Level Selector, Garage Swatches, Pause System, In-Game HUD & Results
 */

import { LevelManager } from '../levels/LevelManager.js';

export class UIManager {
  constructor(soundEngine, levelManager, actions = {}) {
    this.soundEngine = soundEngine;
    this.levelManager = levelManager;
    this.actions = actions;

    // Home Menu Elements
    this.homeMenuOverlay = document.getElementById('home-menu-overlay');
    this.levelsContainer = document.getElementById('levels-container');
    this.btnStartRace = document.getElementById('btn-start-selected-level');

    // HUD Elements
    this.hudContainer = document.getElementById('hud-container');
    this.progressEl = document.getElementById('race-progress-num');
    this.speedEl = document.getElementById('speed-number');
    this.nitroSegments = document.querySelectorAll('#nitro-segments-wrapper .nitro-segment');
    this.posEl = document.getElementById('player-pos-num');
    this.lapEl = document.getElementById('lap-display');
    this.timerEl = document.getElementById('race-timer-display');

    // HUD Circle Buttons
    this.camBtn = document.getElementById('btn-cam-circle');
    this.resetBtn = document.getElementById('btn-reset-circle');
    this.menuBtn = document.getElementById('btn-menu-circle');

    // Pause Modal
    this.pauseModal = document.getElementById('pause-modal');
    this.pauseLevelInfo = document.getElementById('pause-level-info');
    this.btnResume = document.getElementById('btn-resume-race');
    this.btnRestartCurrent = document.getElementById('btn-restart-current-race');
    this.btnPauseReturnHome = document.getElementById('btn-pause-return-home');

    // Results Modal
    this.resultsModal = document.getElementById('results-modal');
    this.btnNextLevel = document.getElementById('btn-next-level');
    this.btnRetryRace = document.getElementById('btn-retry-race');
    this.btnResultsHome = document.getElementById('btn-results-home');

    // VFX
    this.speedLines = document.getElementById('speed-lines-vfx');
    this.nitroTunnel = document.getElementById('nitro-tunnel-vfx');

    this._initHomeMenu();
    this._bindInteractiveControls();
  }

  _initHomeMenu() {
    this.renderLevelCards();
    this._bindTabs();
    this._bindColorSwatches();
    this._bindAudioSettings();

    if (this.btnStartRace) {
      this.btnStartRace.addEventListener('click', () => {
        this.playUiClick();
        const currentLvl = this.levelManager.getCurrentLevel();
        if (this.actions.onStartRace) {
          this.actions.onStartRace(currentLvl.id);
        }
      });
    }
  }

  renderLevelCards() {
    if (!this.levelsContainer) return;
    this.levelsContainer.innerHTML = '';

    LevelManager.LEVELS.forEach(lvl => {
      const isUnlocked = this.levelManager.isLevelUnlocked(lvl.id);
      const isSelected = this.levelManager.currentLevelId === lvl.id;
      const starsCount = this.levelManager.progress.stars[lvl.id] || 0;
      const bestTime = this.levelManager.progress.bestTimes[lvl.id];

      const card = document.createElement('div');
      card.className = `level-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
      card.dataset.levelId = lvl.id;

      let starsHtml = '';
      for (let s = 1; s <= 3; s++) {
        starsHtml += s <= starsCount ? '⭐' : '☆';
      }

      card.innerHTML = `
        <span class="lvl-badge">${lvl.badge}</span>
        <h3 class="lvl-title">${lvl.title}</h3>
        <p class="lvl-desc">${lvl.description}</p>
        <div class="lvl-meta-row">
          <span>${lvl.laps} LAPS // ${lvl.aiDifficulty}</span>
          <span class="lvl-stars">${starsHtml}</span>
        </div>
        ${bestTime ? `<div style="font-size: 0.78rem; color: #94a3b8; font-weight: 700;">RECORD: <strong style="color: #fff;">${bestTime}</strong></div>` : ''}
        ${!isUnlocked ? `<div class="lvl-lock-banner">🔒 LOCKED - ${lvl.trophyReq}</div>` : ''}
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          this.playUiClick();
          this.levelManager.setLevel(lvl.id);
          this.renderLevelCards();
          if (this.actions.onSelectLevel) {
            this.actions.onSelectLevel(lvl.id);
          }
        });
      }

      this.levelsContainer.appendChild(card);
    });
  }

  _bindTabs() {
    const tabButtons = document.querySelectorAll('.menu-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.playUiClick();
        const targetId = btn.getAttribute('data-tab');

        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
      });
    });
  }

  _bindColorSwatches() {
    const swatches = document.querySelectorAll('.color-swatch-btn');
    swatches.forEach(btn => {
      btn.addEventListener('click', () => {
        this.playUiClick();
        swatches.forEach(s => s.classList.remove('active'));
        btn.classList.add('active');

        const hexStr = btn.getAttribute('data-color');
        const hex = parseInt(hexStr, 16);
        this.levelManager.setCarColor(hex);

        if (this.actions.onColorChange) {
          this.actions.onColorChange(hex);
        }
      });
    });
  }

  _bindAudioSettings() {
    if (!this.soundEngine) return;

    // Sliders & value displays
    const sliderMaster = document.getElementById('slider-master-volume');
    const valMaster = document.getElementById('val-master-volume');
    const btnMute = document.getElementById('btn-toggle-mute');

    const sliderMusic = document.getElementById('slider-music-volume');
    const valMusic = document.getElementById('val-music-volume');
    const toggleMusic = document.getElementById('toggle-music-enabled');

    const sliderSFX = document.getElementById('slider-sfx-volume');
    const valSFX = document.getElementById('val-sfx-volume');
    const toggleSFX = document.getElementById('toggle-sfx-enabled');

    const btnTest = document.getElementById('btn-test-sound');

    // Populate initial values from SoundEngine
    const masterPct = Math.round((this.soundEngine.masterVolume ?? 0.85) * 100);
    const musicPct = Math.round((this.soundEngine.musicVolume ?? 0.50) * 100);
    const sfxPct = Math.round((this.soundEngine.sfxVolume ?? 0.90) * 100);

    if (sliderMaster) sliderMaster.value = masterPct;
    if (valMaster) valMaster.textContent = `${masterPct}%`;

    if (sliderMusic) sliderMusic.value = musicPct;
    if (valMusic) valMusic.textContent = `${musicPct}%`;
    if (toggleMusic) toggleMusic.checked = this.soundEngine.isMusicEnabled !== false;

    if (sliderSFX) sliderSFX.value = sfxPct;
    if (valSFX) valSFX.textContent = `${sfxPct}%`;
    if (toggleSFX) toggleSFX.checked = this.soundEngine.isSFXEnabled !== false;

    if (btnMute) {
      if (this.soundEngine.isMuted) {
        btnMute.textContent = 'UNMUTE';
        btnMute.classList.add('muted');
        if (valMaster) valMaster.textContent = '0%';
      } else {
        btnMute.textContent = 'MUTE';
        btnMute.classList.remove('muted');
      }
    }

    // Master Volume Slider
    if (sliderMaster) {
      sliderMaster.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (valMaster) valMaster.textContent = `${val}%`;
        this.soundEngine.setMasterVolume(val / 100);
        if (btnMute && this.soundEngine.isMuted) {
          this.soundEngine.setMuted(false);
          btnMute.textContent = 'MUTE';
          btnMute.classList.remove('muted');
        }
      });
    }

    // Mute Toggle Button
    if (btnMute) {
      btnMute.addEventListener('click', () => {
        this.playUiClick();
        const nowMuted = !this.soundEngine.isMuted;
        this.soundEngine.setMuted(nowMuted);
        if (nowMuted) {
          btnMute.textContent = 'UNMUTE';
          btnMute.classList.add('muted');
          if (valMaster) valMaster.textContent = '0%';
        } else {
          btnMute.textContent = 'MUTE';
          btnMute.classList.remove('muted');
          const currentPct = Math.round(this.soundEngine.masterVolume * 100);
          if (valMaster) valMaster.textContent = `${currentPct}%`;
        }
      });
    }

    // Music Volume Slider
    if (sliderMusic) {
      sliderMusic.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (valMusic) valMusic.textContent = `${val}%`;
        this.soundEngine.setMusicVolume(val / 100);
      });
    }

    // Music Toggle Switch
    if (toggleMusic) {
      toggleMusic.addEventListener('change', (e) => {
        this.playUiClick();
        const enabled = e.target.checked;
        this.soundEngine.setMusicEnabled(enabled);
        if (valMusic) valMusic.style.opacity = enabled ? '1.0' : '0.4';
      });
    }

    // SFX Volume Slider
    if (sliderSFX) {
      sliderSFX.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (valSFX) valSFX.textContent = `${val}%`;
        this.soundEngine.setSFXVolume(val / 100);
      });
    }

    // SFX Toggle Switch
    if (toggleSFX) {
      toggleSFX.addEventListener('change', (e) => {
        this.playUiClick();
        const enabled = e.target.checked;
        this.soundEngine.setSFXEnabled(enabled);
        if (valSFX) valSFX.style.opacity = enabled ? '1.0' : '0.4';
      });
    }

    // Test Audio Button
    if (btnTest) {
      btnTest.addEventListener('click', () => {
        this.soundEngine.playTestAudio();
      });
    }
  }

  _bindInteractiveControls() {
    // 1. Camera Toggle Circle Button
    if (this.camBtn) {
      this.camBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.soundEngine) this.soundEngine.playTone(840, 'sine', 0.08, 0.25);
        if (this.actions.onToggleCamera) this.actions.onToggleCamera();
      });
    }

    // 2. Reset Button (!)
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.soundEngine) this.soundEngine.playTone(340, 'triangle', 0.15, 0.4);
        if (this.actions.onResetCar) this.actions.onResetCar();
      });
    }

    // 3. Menu / Pause Button
    if (this.menuBtn) {
      this.menuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openPauseMenu();
      });
    }

    // 4. Pause Menu Actions
    if (this.btnResume) {
      this.btnResume.addEventListener('click', () => {
        this.playUiClick();
        this.closePauseMenu();
        if (this.actions.onResumeRace) this.actions.onResumeRace();
      });
    }

    if (this.btnRestartCurrent) {
      this.btnRestartCurrent.addEventListener('click', () => {
        this.playUiClick();
        this.closePauseMenu();
        if (this.actions.onRestartRace) this.actions.onRestartRace();
      });
    }

    if (this.btnPauseReturnHome) {
      this.btnPauseReturnHome.addEventListener('click', () => {
        this.playUiClick();
        this.closePauseMenu();
        this.showHomeMenu();
        if (this.actions.onReturnToMenu) this.actions.onReturnToMenu();
      });
    }

    // 5. Results Buttons
    if (this.btnRetryRace) {
      this.btnRetryRace.addEventListener('click', () => {
        this.playUiClick();
        if (this.resultsModal) this.resultsModal.classList.add('hidden');
        if (this.actions.onRestartRace) this.actions.onRestartRace();
      });
    }

    if (this.btnNextLevel) {
      this.btnNextLevel.addEventListener('click', () => {
        this.playUiClick();
        if (this.resultsModal) this.resultsModal.classList.add('hidden');
        const nextLevelId = this.levelManager.currentLevelId + 1;
        if (this.actions.onStartRace) this.actions.onStartRace(nextLevelId);
      });
    }

    if (this.btnResultsHome) {
      this.btnResultsHome.addEventListener('click', () => {
        this.playUiClick();
        if (this.resultsModal) this.resultsModal.classList.add('hidden');
        this.showHomeMenu();
        if (this.actions.onReturnToMenu) this.actions.onReturnToMenu();
      });
    }
  }

  showHomeMenu() {
    this.renderLevelCards();
    if (this.homeMenuOverlay) this.homeMenuOverlay.classList.remove('hidden');
    if (this.hudContainer) this.hudContainer.style.display = 'none';
  }

  hideHomeMenu() {
    if (this.homeMenuOverlay) this.homeMenuOverlay.classList.add('hidden');
    if (this.hudContainer) this.hudContainer.style.display = 'grid';
  }

  openPauseMenu() {
    const curLvl = this.levelManager.getCurrentLevel();
    if (this.pauseLevelInfo) {
      this.pauseLevelInfo.textContent = `${curLvl.badge} // ${curLvl.title}`;
    }
    if (this.pauseModal) this.pauseModal.classList.remove('hidden');
    if (this.actions.onPauseRace) this.actions.onPauseRace();
  }

  closePauseMenu() {
    if (this.pauseModal) this.pauseModal.classList.add('hidden');
  }

  updateHUD(physics, raceData) {
    if (!physics) return;

    // 1. Speed
    const speedKmh = physics.getSpeedKmh();
    if (this.speedEl) {
      this.speedEl.textContent = speedKmh;
    }

    // 2. Nitro Arc (12 curved segments)
    if (this.nitroSegments && this.nitroSegments.length > 0) {
      const nitroRatio = Math.max(0, Math.min(1.0, physics.nitro / physics.maxNitro));
      const activeCount = Math.round(nitroRatio * this.nitroSegments.length);

      this.nitroSegments.forEach((seg, idx) => {
        if (idx < activeCount) {
          seg.classList.add('active');
        } else {
          seg.classList.remove('active');
        }
      });
    }

    // 3. Race Meta (Progress %, Position, Lap, Timer)
    if (raceData) {
      if (this.progressEl) {
        this.progressEl.textContent = raceData.progressPct ?? 0;
      }
      if (this.posEl) {
        this.posEl.textContent = raceData.position ?? 1;
      }
      if (this.lapEl) {
        this.lapEl.textContent = `LAP ${raceData.currentLap || 1}/${raceData.totalLaps || 2}`;
      }
      if (this.timerEl) {
        this.timerEl.textContent = raceData.timerText ?? '0:00.00';
      }
    }

    // 4. VFX Overlays
    if (this.speedLines) {
      const speedRatio = Math.max(0, (speedKmh - 160) / 160);
      this.speedLines.style.opacity = Math.min(0.8, speedRatio * 0.9);
    }

    if (this.nitroTunnel) {
      this.nitroTunnel.style.opacity = physics.isBoosting ? '0.75' : '0';
    }
  }

  showResults(results, levelResult) {
    if (this.resultsModal) this.resultsModal.classList.remove('hidden');

    const header = document.getElementById('results-header');
    const trophy = document.getElementById('results-trophy');
    const totalTimeEl = document.getElementById('res-total-time');
    const bestLapEl = document.getElementById('res-best-lap');
    const starsRow = document.getElementById('results-stars-row');
    const unlockRow = document.getElementById('res-unlock-row');
    const unlockText = document.getElementById('res-unlock-text');

    if (results.position === 1) {
      if (trophy) trophy.textContent = '🏆';
      if (header) header.textContent = '1ST PLACE VICTORY!';
      if (this.soundEngine) this.soundEngine.playVictoryFanfare();
    } else {
      if (trophy) trophy.textContent = '🏁';
      if (header) header.textContent = `${results.position}${this._getOrdinal(results.position)} PLACE FINISH`;
    }

    if (starsRow && levelResult) {
      let stars = '';
      for (let s = 1; s <= 3; s++) {
        stars += s <= levelResult.starsEarned ? '⭐' : '☆';
      }
      starsRow.textContent = stars;
    }

    if (totalTimeEl) totalTimeEl.textContent = results.totalTime;
    if (bestLapEl) bestLapEl.textContent = results.bestLapTime;

    // Show unlock alert and Next Level button if newly unlocked or available
    if (levelResult && levelResult.newlyUnlocked) {
      const nextLvl = this.levelManager.getLevel(levelResult.newlyUnlocked);
      if (unlockRow) unlockRow.style.display = 'flex';
      if (unlockText) unlockText.textContent = `UNLOCKED: ${nextLvl.badge} (${nextLvl.title})!`;
      if (this.btnNextLevel) {
        this.btnNextLevel.style.display = 'inline-block';
        this.btnNextLevel.textContent = `RACE ${nextLvl.badge} ➔`;
      }
    } else {
      const nextId = this.levelManager.currentLevelId + 1;
      if (this.levelManager.isLevelUnlocked(nextId) && this.btnNextLevel) {
        const nextLvl = this.levelManager.getLevel(nextId);
        this.btnNextLevel.style.display = 'inline-block';
        this.btnNextLevel.textContent = `RACE ${nextLvl.badge} ➔`;
      } else if (this.btnNextLevel) {
        this.btnNextLevel.style.display = 'none';
      }
      if (unlockRow) unlockRow.style.display = 'none';
    }
  }

  playUiClick() {
    if (this.soundEngine) {
      this.soundEngine.init();
      this.soundEngine.playTone(600, 'sine', 0.05, 0.2);
    }
  }

  _getOrdinal(n) {
    if (n === 2) return 'ND';
    if (n === 3) return 'RD';
    return 'TH';
  }
}
