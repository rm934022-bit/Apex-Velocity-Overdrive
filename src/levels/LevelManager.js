/**
 * Apex Velocity: Overdrive
 * Level Progression & Championship Manager
 * Manages 5 distinct racing tiers, custom track configurations, atmospheric presets, save progression, and star ratings
 */

export class LevelManager {
  static STORAGE_KEY = 'apex_velocity_progress_v3';

  static LEVELS = [
    {
      id: 1,
      title: 'BUDDH GP EXPRESSWAY',
      subtitle: 'Greater Noida // Grand Prix of India',
      laps: 2,
      aiTopSpeedKmh: 280,
      aiDifficulty: 'NORMAL',
      skyPreset: 'DAY',
      badge: '🇮🇳 LEVEL 1',
      trackTheme: 'buddh',
      description: 'High-speed Formula circuit inspired by the Buddh International Circuit in Greater Noida. Featuring Yamuna Expressway straights, grand India Gate torana arches, and tricolor grandstands.',
      trophyReq: 'Finish 1st or 2nd to unlock Level 2'
    },
    {
      id: 2,
      title: 'THAR DESERT RALLY',
      subtitle: 'Jaisalmer, Rajasthan // Golden Fort Ridge',
      laps: 2,
      aiTopSpeedKmh: 300,
      aiDifficulty: 'INTERMEDIATE',
      skyPreset: 'CANYON',
      badge: '🏜️ LEVEL 2',
      trackTheme: 'thar',
      description: 'Blistering desert circuit carved through the golden sand dunes and sandstone fortress bastions of Jaisalmer, Rajasthan. Rapid S-curves and historic Rajasthani fort watchtowers.',
      trophyReq: 'Finish 1st or 2nd to unlock Level 3'
    },
    {
      id: 3,
      title: 'GOA COASTAL EXPRESS',
      subtitle: 'Konkan Highway // Arabian Sea Hairpins',
      laps: 3,
      aiTopSpeedKmh: 318,
      aiDifficulty: 'PRO',
      skyPreset: 'SUNSET',
      badge: '🌴 LEVEL 3',
      trackTheme: 'goa',
      description: 'High-velocity coastal highway winding along the sun-drenched Arabian Sea in Goa. Featuring swaying coconut palm groves, beachside hairpins, and iconic roadside auto-rickshaws.',
      trophyReq: 'Finish 1st or 2nd to unlock Level 4'
    },
    {
      id: 4,
      title: 'MUMBAI SEA LINK BY NIGHT',
      subtitle: 'Bandra-Worli // Marine Drive Expressway',
      laps: 3,
      aiTopSpeedKmh: 335,
      aiDifficulty: 'EXPERT',
      skyPreset: 'NIGHT',
      badge: '🌃 LEVEL 4',
      trackTheme: 'mumbai',
      description: 'Midnight expressway race across Mumbai\'s iconic Bandra-Worli Sea Link and Marine Drive. Illuminated cable-stayed pylons, glowing city skyline, and 90-degree urban intersections.',
      trophyReq: 'Finish 1st or 2nd to unlock Level 5'
    },
    {
      id: 5,
      title: 'HIMALAYAN PASS',
      subtitle: 'Ladakh Khardung La // 18,000 FT Mountain Ring',
      laps: 3,
      aiTopSpeedKmh: 350,
      aiDifficulty: 'LEGEND',
      skyPreset: 'ALPINE',
      badge: '🏔️ LEVEL 5',
      trackTheme: 'ladakh',
      description: 'The ultimate master mountain championship on the treacherous Himalayan ridge in Ladakh. High altitude switchbacks, Buddhist prayer flags fluttering in mountain fog, and hairpin drops.',
      trophyReq: 'Grand Champion of Apex Velocity'
    }
  ];

  constructor() {
    this.currentLevelId = 1;
    this.progress = this._loadProgress();
  }

  _loadProgress() {
    try {
      const saved = localStorage.getItem(LevelManager.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.unlockedLevels && parsed.unlockedLevels.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read localStorage progress:', e);
    }

    // Default starter progress (5 levels supported)
    return {
      unlockedLevels: [1],
      stars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      bestTimes: { 1: null, 2: null, 3: null, 4: null, 5: null },
      selectedCarColor: 0xdc2020, // Rosso Corsa Red
      selectedCarId: 'apex_gtr'
    };
  }

  saveProgress() {
    try {
      localStorage.setItem(LevelManager.STORAGE_KEY, JSON.stringify(this.progress));
    } catch (e) {
      console.warn('Could not save progress to localStorage:', e);
    }
  }

  getLevel(id) {
    return LevelManager.LEVELS.find(lvl => lvl.id === id) || LevelManager.LEVELS[0];
  }

  getCurrentLevel() {
    return this.getLevel(this.currentLevelId);
  }

  setLevel(id) {
    if (this.isLevelUnlocked(id)) {
      this.currentLevelId = id;
      return true;
    }
    return false;
  }

  isLevelUnlocked(id) {
    return this.progress.unlockedLevels.includes(id);
  }

  recordRaceResult(levelId, position, totalTimeSec, totalTimeStr) {
    let starsEarned = 1;
    if (position === 1) starsEarned = 3;
    else if (position === 2) starsEarned = 2;

    // Update stars if higher
    const currentStars = this.progress.stars[levelId] || 0;
    if (starsEarned > currentStars) {
      this.progress.stars[levelId] = starsEarned;
    }

    // Update best time
    const currentBest = this.progress.bestTimes[levelId];
    if (!currentBest || totalTimeStr < currentBest) {
      this.progress.bestTimes[levelId] = totalTimeStr;
    }

    // Unlock next level if placed 1st or 2nd
    let newlyUnlocked = null;
    if (position <= 2 && levelId < LevelManager.LEVELS.length) {
      const nextId = levelId + 1;
      if (!this.progress.unlockedLevels.includes(nextId)) {
        this.progress.unlockedLevels.push(nextId);
        newlyUnlocked = nextId;
      }
    }

    this.saveProgress();

    return {
      starsEarned,
      newlyUnlocked,
      bestTime: this.progress.bestTimes[levelId]
    };
  }

  setCarColor(hex) {
    this.progress.selectedCarColor = hex;
    this.saveProgress();
  }

  getCarColor() {
    return this.progress.selectedCarColor || 0xdc2020;
  }
}
