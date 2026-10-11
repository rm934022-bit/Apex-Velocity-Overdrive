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

    // Multiplayer DOM Elements
    this.multiplayerManager = null;
    this.isLastRaceMultiplayer = false;
    this.mpWaitingBanner = document.getElementById('mp-waiting-banner');
    this.mpWaitingCount = document.getElementById('mp-waiting-count');
    this.resMpStandingsBox = document.getElementById('res-mp-standings-box');
    this.resMpStandingsList = document.getElementById('res-mp-standings-list');
    this.mpStatusDot = document.getElementById('mp-status-dot');
    this.mpStatusLabel = document.getElementById('mp-status-label');
    this.mpInputName = document.getElementById('mp-input-name');
    this.mpInputRoom = document.getElementById('mp-input-room');
    this.btnMpJoin = document.getElementById('btn-mp-join');
    this.btnStartSplitScreen = document.getElementById('btn-start-splitscreen');
    this.mpRoomTitle = document.getElementById('mp-room-title');
    this.mpHostBadge = document.getElementById('mp-host-badge');
    this.mpPlayersCount = document.getElementById('mp-players-count');
    this.mpPlayersList = document.getElementById('mp-players-list');
    this.mpHostControls = document.getElementById('mp-host-controls');
    this.mpClientWaiting = document.getElementById('mp-client-waiting');
    this.mpSelectCircuit = document.getElementById('mp-select-circuit');
    this.mpSelectLaps = document.getElementById('mp-select-laps');
    this.btnMpLaunchRace = document.getElementById('btn-mp-launch-race');
    this.mpLiveLeaderboard = document.getElementById('mp-live-leaderboard');
    this.mpBoardList = document.getElementById('mp-board-list');
    this.btnMpRandom = document.getElementById('btn-mp-random');
    this.btnMpShare = document.getElementById('btn-mp-share');
    this.mpClientTrackInfo = document.getElementById('mp-client-track-info');
    this.mpToast = document.getElementById('mp-toast');
    this.toastTimeout = null;

    this._initHomeMenu();
    this._bindInteractiveControls();
  }

  showToast(msg, duration = 3000) {
    if (!this.mpToast) return;
    this.mpToast.textContent = msg;
    this.mpToast.classList.remove('hidden');
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      if (this.mpToast) this.mpToast.classList.add('hidden');
    }, duration);
  }

  showWaitingForOthers(show = true, finishedCount = 1, totalCount = 2, secondsRemaining = null) {
    if (this.mpWaitingBanner) {
      this.mpWaitingBanner.classList.toggle('hidden', !show);
      if (this.mpWaitingCount) {
        const timeText = (secondsRemaining !== null && secondsRemaining !== undefined) ? ` • Results in ${secondsRemaining}s` : '';
        this.mpWaitingCount.textContent = `(${finishedCount}/${totalCount})${timeText}`;
      }
    }
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

        // Connect/join multiplayer lobby when navigating to multiplayer tab
        if (targetId === 'tab-multiplayer' && this.multiplayerManager) {
          if (!this.multiplayerManager.room) {
            const name = (this.mpInputName?.value || 'Racer 1').trim();
            const room = (this.mpInputRoom?.value || 'BHARAT-101').toUpperCase().trim();
            this.multiplayerManager.joinRoom(room, name, this.levelManager.selectedCarModel || 'apex_gtr', this.levelManager.getCarColor());
          }
        }
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
        if (this.isLastRaceMultiplayer) {
          if (this.actions.onRestartMultiplayerRace) {
            this.actions.onRestartMultiplayerRace();
          }
        } else {
          if (this.actions.onRestartRace) this.actions.onRestartRace();
        }
      });
    }

    if (this.btnNextLevel) {
      this.btnNextLevel.addEventListener('click', () => {
        this.playUiClick();
        if (this.resultsModal) this.resultsModal.classList.add('hidden');
        if (this.isLastRaceMultiplayer) {
          if (this.actions.onNextMultiplayerRace) {
            this.actions.onNextMultiplayerRace();
          }
        } else {
          const nextLevelId = this.levelManager.currentLevelId + 1;
          if (this.actions.onStartRace) this.actions.onStartRace(nextLevelId);
        }
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

  updateHUD(physics, raceData, isMultiplayer = false) {
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
        if (isMultiplayer && this.multiplayerManager?.room && this.multiplayerManager.room.state === 'RACING') {
          const standings = this.multiplayerManager.getStandings(raceData.progressPct ?? 0);
          const myIdx = standings.findIndex(s => s.isLocal);
          this.posEl.textContent = (myIdx >= 0 ? myIdx + 1 : 1);
          const totalEl = document.getElementById('player-pos-total');
          if (totalEl) totalEl.textContent = `/${Math.max(2, standings.length)}`;
        } else {
          // Pure singleplayer: Player vs AI rival
          this.posEl.textContent = raceData.position ?? 1;
          const totalEl = document.getElementById('player-pos-total');
          if (totalEl) totalEl.textContent = '/2';
        }
      }
      if (this.lapEl) {
        this.lapEl.textContent = `LAP ${raceData.currentLap || 1}/${raceData.totalLaps || 2}`;
      }
      if (this.timerEl) {
        this.timerEl.textContent = raceData.timerText ?? '0:00.00';
      }
    }

    // Ensure multiplayer leaderboard card is strictly hidden in singleplayer
    if (!isMultiplayer) {
      this.showMultiplayerLeaderboard(false);
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
    this.isLastRaceMultiplayer = !!results.isMultiplayer;

    const header = document.getElementById('results-header');
    const trophy = document.getElementById('results-trophy');
    const totalTimeEl = document.getElementById('res-total-time');
    const bestLapEl = document.getElementById('res-best-lap');
    const starsRow = document.getElementById('results-stars-row');
    const unlockRow = document.getElementById('res-unlock-row');
    const unlockText = document.getElementById('res-unlock-text');

    if (totalTimeEl) totalTimeEl.textContent = results.totalTime;
    if (bestLapEl) bestLapEl.textContent = results.bestLapTime;

    if (results.isMultiplayer) {
      // --- MULTIPLAYER RESULTS MODE ---
      if (starsRow) starsRow.style.display = 'none';

      if (results.position === 1) {
        if (trophy) trophy.textContent = '🏆';
        if (header) header.textContent = '1ST PLACE VICTORY!';
        if (this.soundEngine) this.soundEngine.playVictoryFanfare();
      } else if (results.position === 2) {
        if (trophy) trophy.textContent = '🥈';
        if (header) header.textContent = '2ND PLACE FINISH!';
      } else {
        if (trophy) trophy.textContent = '🏁';
        if (header) header.textContent = `${results.position}${this._getOrdinal(results.position)} PLACE FINISH`;
      }

      // Render Multiplayer Final Standings
      if (this.resMpStandingsBox && this.resMpStandingsList && results.standings) {
        this.resMpStandingsBox.style.display = 'block';
        this.resMpStandingsList.innerHTML = '';

        results.standings.forEach((r, idx) => {
          const row = document.createElement('div');
          const isWinner = (r.position === 1 || idx === 0);
          const isLocal = r.isLocal || (r.id === this.multiplayerManager?.playerId);
          row.className = `mp-podium-row ${isWinner ? 'is-winner' : ''} ${isLocal ? 'is-self' : ''}`;
          row.innerHTML = `
            <span><strong>#${r.position || idx + 1}</strong> ${r.name || 'Racer'} ${isLocal ? '(YOU)' : ''}</span>
            <span>${r.formattedTime || (r.time ? this.formatTime(r.time) : '--:--.--')}</span>
          `;
          this.resMpStandingsList.appendChild(row);
        });
      }

      // Show next circuit preview banner
      const nextLvlId = results.nextLevelId || ((this.levelManager.currentLevelId % 5) + 1);
      const nextLvl = this.levelManager.getLevel(nextLvlId);
      if (unlockRow && nextLvl) {
        unlockRow.style.display = 'flex';
        if (unlockText) unlockText.textContent = `NEXT CIRCUIT: ${nextLvl.badge} (${nextLvl.title})`;
      }

      const isHost = !!this.multiplayerManager?.isHost;
      if (this.btnNextLevel) {
        this.btnNextLevel.style.display = 'inline-block';
        this.btnNextLevel.textContent = isHost ? `⚡ NEXT CIRCUIT (MP) ➔` : `⏳ WAITING FOR HOST...`;
      }
      if (this.btnRetryRace) {
        this.btnRetryRace.textContent = isHost ? 'RESTART RACE (MP)' : 'WAIT FOR RESTART';
      }
    } else {
      // --- SINGLE PLAYER RESULTS MODE ---
      if (this.resMpStandingsBox) this.resMpStandingsBox.style.display = 'none';
      if (starsRow) {
        starsRow.style.display = 'flex';
        if (levelResult) {
          let stars = '';
          for (let s = 1; s <= 3; s++) {
            stars += s <= levelResult.starsEarned ? '⭐' : '☆';
          }
          starsRow.textContent = stars;
        }
      }

      if (results.position === 1) {
        if (trophy) trophy.textContent = '🏆';
        if (header) header.textContent = '1ST PLACE VICTORY!';
        if (this.soundEngine) this.soundEngine.playVictoryFanfare();
      } else {
        if (trophy) trophy.textContent = '🏁';
        if (header) header.textContent = `${results.position}${this._getOrdinal(results.position)} PLACE FINISH`;
      }

      if (this.btnRetryRace) {
        this.btnRetryRace.textContent = 'RACE AGAIN';
      }

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
  }

  formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds)) return '0:00.00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds * 100) % 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
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

  // ===========================================================================
  // MULTIPLAYER LOBBY & LIVE STANDINGS HUD
  // ===========================================================================
  bindMultiplayer(mpManager) {
    this.multiplayerManager = mpManager;
    if (!mpManager) return;

    // Check for room invite code in URL (?room=CODE or ?party=CODE)
    const urlParams = new URLSearchParams(window.location.search);
    const queryRoom = urlParams.get('room') || urlParams.get('party');
    if (queryRoom && this.mpInputRoom) {
      const roomToJoin = queryRoom.toUpperCase().trim();
      this.mpInputRoom.value = roomToJoin;
      
      // Auto-switch directly to multiplayer tab so player lands in the party room
      const tabButtons = document.querySelectorAll('.menu-tab-btn');
      const tabPanes = document.querySelectorAll('.tab-pane');
      const mpTabBtn = document.querySelector('[data-tab="tab-multiplayer"]');
      const mpPane = document.getElementById('tab-multiplayer');

      if (mpTabBtn && mpPane) {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        mpTabBtn.classList.add('active');
        mpPane.classList.add('active');
      }
    }

    // Load saved driver name - use sessionStorage for tab-distinct names on same browser
    let savedName = sessionStorage.getItem('apex_racer_name');
    if (!savedName) {
      const randNum = Math.floor(10 + Math.random() * 90);
      savedName = `Racer ${randNum}`;
      sessionStorage.setItem('apex_racer_name', savedName);
    }
    if (this.mpInputName) {
      this.mpInputName.value = savedName;
      mpManager.playerName = savedName;
    }

    // Sync initial connection state immediately
    if (this.mpStatusDot) {
      this.mpStatusDot.className = 'status-dot online';
    }
    if (this.mpStatusLabel) {
      this.mpStatusLabel.textContent = 'ONLINE - PARTY LOBBY READY';
    }

    // If invited via link, auto-join immediately
    if (queryRoom) {
      const roomToJoin = queryRoom.toUpperCase().trim();
      this.showToast(`Joining Party Room ${roomToJoin}...`);
      mpManager.joinRoom(roomToJoin, savedName, this.levelManager.selectedCarModel || 'apex_gtr', this.levelManager.getCarColor());
    }

    // Set callbacks from multiplayer manager
    mpManager.setCallbacks({
      onConnectChange: (connected) => {
        if (this.mpStatusDot) {
          this.mpStatusDot.className = `status-dot ${connected ? 'online' : 'offline'}`;
        }
        if (this.mpStatusLabel) {
          this.mpStatusLabel.textContent = connected ? 'ONLINE - PARTY LOBBY READY' : 'CONNECTING TO PARTY NETWORK...';
        }
        // Auto-join room if user is currently viewing the multiplayer tab and not in room
        const mpPane = document.getElementById('tab-multiplayer');
        if (connected && mpPane && mpPane.classList.contains('active') && !mpManager.room) {
          const roomId = (this.mpInputRoom?.value || 'BHARAT-101').toUpperCase().trim();
          const name = (this.mpInputName?.value || 'Racer').trim();
          mpManager.joinRoom(roomId, name, this.levelManager.selectedCarModel || 'apex_gtr', this.levelManager.getCarColor());
        }
      },
      onJoined: (data) => {
        this._updateLobbyUI(data.room, data.playerId);
        this.showToast(`✅ Connected to Party Room ${data.room.id}!`);
      },
      onJoinFailed: (reason) => {
        this.showToast(`⚠️ ${reason}`);
      },
      onRoomStateChange: (room) => {
        this._updateLobbyUI(room, mpManager.playerId);
      },
      onPlayerJoined: (player) => {
        this.playUiClick();
        if (mpManager.room) this._updateLobbyUI(mpManager.room, mpManager.playerId);
        this.showToast(`🏎️ ${player.name} joined the party!`);
      },
      onPlayerLeft: (playerId) => {
        if (mpManager.room) this._updateLobbyUI(mpManager.room, mpManager.playerId);
        this.showToast('👋 A racer left the party.');
      },
      onLevelSelected: (levelId, laps) => {
        if (this.mpSelectCircuit) this.mpSelectCircuit.value = levelId;
        if (this.mpSelectLaps) this.mpSelectLaps.value = laps;
        if (mpManager.room) {
          mpManager.room.levelId = levelId;
          mpManager.room.laps = laps;
          this._updateLobbyUI(mpManager.room, mpManager.playerId);
        }
      }
    });

    // Driver name change (supports typing and Enter key)
    if (this.mpInputName) {
      const onNameUpdate = () => {
        const val = this.mpInputName.value.trim() || 'Racer';
        sessionStorage.setItem('apex_racer_name', val);
        mpManager.updateProfile(val);
      };
      this.mpInputName.addEventListener('change', onNameUpdate);
      this.mpInputName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onNameUpdate();
          if (this.btnMpJoin) this.btnMpJoin.click();
        }
      });
    }

    // Join room button & Enter key on room code
    if (this.btnMpJoin) {
      this.btnMpJoin.addEventListener('click', () => {
        this.playUiClick();
        const roomId = (this.mpInputRoom?.value || 'BHARAT-101').toUpperCase().trim();
        const name = (this.mpInputName?.value || 'Racer').trim();
        if (this.mpInputRoom) this.mpInputRoom.value = roomId;
        sessionStorage.setItem('apex_racer_name', name);
        this.showToast(`Joining Party Room ${roomId}...`);
        mpManager.joinRoom(roomId, name, this.levelManager.selectedCarModel || 'apex_gtr', this.levelManager.getCarColor());
      });
    }

    if (this.mpInputRoom) {
      this.mpInputRoom.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (this.btnMpJoin) this.btnMpJoin.click();
        }
      });
    }

    // Random Party Code button
    if (this.btnMpRandom) {
      this.btnMpRandom.addEventListener('click', () => {
        this.playUiClick();
        const prefixes = ['APEX', 'SPEED', 'TURBO', 'NITRO', 'DRIFT', 'VIPER', 'BHARAT'];
        const num = Math.floor(10 + Math.random() * 90);
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const newCode = `${prefix}-${num}`;
        if (this.mpInputRoom) this.mpInputRoom.value = newCode;
        const name = (this.mpInputName?.value || 'Racer').trim();
        this.showToast(`Created Party Code: ${newCode}`);
        mpManager.joinRoom(newCode, name, this.levelManager.selectedCarModel || 'apex_gtr', this.levelManager.getCarColor());
      });
    }

    // Share Party Link / Copy Code button
    if (this.btnMpShare) {
      this.btnMpShare.addEventListener('click', async () => {
        this.playUiClick();
        const activeRoom = mpManager.room?.id || (this.mpInputRoom?.value || 'BHARAT-101').toUpperCase().trim();
        const shareUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(activeRoom)}`;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(shareUrl);
            this.showToast(`📋 Party Invite Link Copied: ${activeRoom}`);
          } else {
            prompt('Copy this Party Invite Link:', shareUrl);
          }
        } catch (e) {
          prompt('Copy this Party Invite Link:', shareUrl);
        }
      });
    }

    // Host circuit & laps selection change
    if (this.mpSelectCircuit) {
      this.mpSelectCircuit.addEventListener('change', () => {
        const lvlId = parseInt(this.mpSelectCircuit.value, 10);
        const laps = parseInt(this.mpSelectLaps?.value || '2', 10);
        mpManager.selectLevel(lvlId, laps);
      });
    }

    if (this.mpSelectLaps) {
      this.mpSelectLaps.addEventListener('change', () => {
        const lvlId = parseInt(this.mpSelectCircuit?.value || '1', 10);
        const laps = parseInt(this.mpSelectLaps.value, 10);
        mpManager.selectLevel(lvlId, laps);
      });
    }

    // Host launch multiplayer race button
    if (this.btnMpLaunchRace) {
      this.btnMpLaunchRace.addEventListener('click', () => {
        this.playUiClick();
        if (!mpManager.isHost && mpManager.room && mpManager.room.hostId !== mpManager.playerId) {
          alert('Only the room host can launch the multiplayer race.');
          return;
        }
        mpManager.startRace();
      });
    }

    // Local 2-Player Split-Screen button
    if (this.btnStartSplitScreen) {
      this.btnStartSplitScreen.addEventListener('click', () => {
        this.playUiClick();
        if (this.actions.onStartSplitScreen) {
          this.actions.onStartSplitScreen();
        }
      });
    }

    // Skip waiting button on finish banner to immediately view results
    const btnSkipWaiting = document.getElementById('btn-mp-skip-waiting');
    if (btnSkipWaiting) {
      btnSkipWaiting.addEventListener('click', () => {
        this.playUiClick();
        if (this.actions.onForceShowResults) {
          this.actions.onForceShowResults();
        }
      });
    }
  }

  _updateLobbyUI(room, localPlayerId) {
    if (!room) {
      if (this.mpRoomTitle) this.mpRoomTitle.textContent = '---';
      if (this.mpPlayersCount) this.mpPlayersCount.textContent = '0/4';
      if (this.mpHostBadge) {
        this.mpHostBadge.textContent = 'NOT IN ROOM';
        this.mpHostBadge.style.background = '#64748b';
        this.mpHostBadge.style.color = '#fff';
      }
      if (this.mpHostControls) this.mpHostControls.style.display = 'none';
      if (this.mpClientWaiting) this.mpClientWaiting.classList.add('hidden');
      if (this.mpPlayersList) {
        this.mpPlayersList.innerHTML = '<div style="color: #64748b; font-size: 0.85rem; padding: 18px; text-align: center;">Enter a party room code above and click JOIN / CREATE</div>';
      }
      return;
    }

    if (this.mpRoomTitle) this.mpRoomTitle.textContent = room.id;
    if (this.mpInputRoom) this.mpInputRoom.value = room.id;
    if (this.mpPlayersCount) this.mpPlayersCount.textContent = `${room.players.length}/4`;

    const isHost = (room.hostId === localPlayerId);
    if (this.mpHostBadge) {
      this.mpHostBadge.textContent = isHost ? '👑 HOST' : 'RACER';
      this.mpHostBadge.style.background = isHost ? '#00f0ff' : '#94a3b8';
      this.mpHostBadge.style.color = isHost ? '#0f172a' : '#fff';
    }

    // Show host controls to host only
    if (this.mpHostControls) {
      this.mpHostControls.style.display = isHost ? 'flex' : 'none';
    }
    if (this.mpClientWaiting) {
      this.mpClientWaiting.classList.toggle('hidden', isHost);
    }

    // Update track preview in waiting banner
    const levelNames = {
      1: 'BUDDH GP',
      2: 'THAR DESERT',
      3: 'GOA COAST',
      4: 'MUMBAI SEA LINK',
      5: 'HIMALAYAN PASS'
    };
    if (this.mpClientTrackInfo) {
      const trackName = levelNames[room.levelId || 1] || `Circuit ${room.levelId || 1}`;
      this.mpClientTrackInfo.textContent = `Circuit: ${trackName} (${room.laps || 2} Laps)`;
    }

    if (this.mpSelectCircuit && isHost) {
      this.mpSelectCircuit.value = room.levelId || 1;
    }
    if (this.mpSelectLaps && isHost) {
      this.mpSelectLaps.value = room.laps || 2;
    }

    // Render racers in lobby
    if (this.mpPlayersList) {
      this.mpPlayersList.innerHTML = '';
      room.players.forEach(p => {
        const row = document.createElement('div');
        const isSelf = p.id === localPlayerId;
        row.className = `mp-player-row ${isSelf ? 'is-self' : ''}`;

        const hexColor = '#' + (p.color !== undefined ? p.color : 0x00f0ff).toString(16).padStart(6, '0');
        row.innerHTML = `
          <div class="mp-player-info">
            <span class="mp-slot-pill ${p.slot === 1 ? 'p1' : 'p2'}">P${p.slot}</span>
            <span class="mp-color-dot" style="background-color: ${hexColor};"></span>
            <span class="mp-player-name">${p.name} ${isSelf ? '(YOU)' : ''}</span>
          </div>
          <div class="mp-player-meta">
            <span>${p.isHost ? '👑 HOST' : 'READY'}</span>
          </div>
        `;
        this.mpPlayersList.appendChild(row);
      });
    }
  }

  updateMultiplayerLeaderboard(standings) {
    if (!this.mpBoardList || !standings || standings.length === 0) return;
    this.mpBoardList.innerHTML = '';

    standings.forEach((racer, idx) => {
      const row = document.createElement('div');
      row.className = `mp-board-row ${racer.isLocal ? 'is-p1' : ''}`;
      const pct = (racer.progressPct !== undefined) ? racer.progressPct : Math.min(100, Math.max(0, Math.round((racer.progress || 0) * 100)));
      row.innerHTML = `
        <span><strong class="mp-board-pos">#${idx + 1}</strong> ${racer.name} ${racer.isLocal ? '(YOU)' : ''}</span>
        <span>${pct}%</span>
      `;
      this.mpBoardList.appendChild(row);
    });
  }

  showMultiplayerLeaderboard(show = true) {
    if (this.mpLiveLeaderboard) {
      this.mpLiveLeaderboard.classList.toggle('hidden', !show);
    }
  }
}
