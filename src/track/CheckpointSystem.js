/**
 * Apex Velocity: Overdrive
 * Checkpoint & Race Manager: Lap Tracking, Splits, Leaderboard Positions, and Minimap Radar
 */

import * as THREE from 'three';

export class CheckpointSystem {
  constructor(trackSpline, totalLaps = 3) {
    this.trackSpline = trackSpline;
    this.totalLaps = totalLaps;

    // Player State
    this.currentLap = 1;
    this.currentCheckpointIndex = 0;
    this.maxCheckpointVisited = 0;
    this.lapStartTime = 0;
    this.currentLapTime = 0;
    this.bestLapTime = null;
    this.totalRaceTime = 0;
    this.raceFinished = false;
    this.displayedProgress = 0;
    this.prevSplineT = 0.0;
    this.finalPosition = null;

    // Checkpoint Coordinates (12 checkpoints around track)
    this.checkpointCount = 12;
    this.checkpoints = [];
    for (let i = 0; i < this.checkpointCount; i++) {
      const t = i / this.checkpointCount;
      this.checkpoints.push({
        index: i,
        t: t,
        pos: this.trackSpline.getPointAt(t),
        radius: 35.0
      });
    }

    // Minimap Canvas
    this.minimapCanvas = document.getElementById('track-minimap');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
  }

  setTotalLaps(laps) {
    this.totalLaps = laps;
  }

  setTrackSpline(trackSpline, totalLaps) {
    this.trackSpline = trackSpline;
    if (totalLaps) this.totalLaps = totalLaps;
    this.currentLap = 1;
    this.currentCheckpointIndex = 0;
    this.maxCheckpointVisited = 0;
    this.currentLapTime = 0;
    this.totalRaceTime = 0;
    this.raceFinished = false;
    this.displayedProgress = 0;
    this.prevSplineT = 0.0;
    this.finalPosition = null;
    this.checkpoints = [];
    for (let i = 0; i < this.checkpointCount; i++) {
      const t = i / this.checkpointCount;
      this.checkpoints.push({
        index: i,
        t: t,
        pos: this.trackSpline.getPointAt(t),
        radius: 35.0
      });
    }
  }

  startRace() {
    this.lapStartTime = performance.now();
    this.currentLap = 1;
    this.currentCheckpointIndex = 0;
    this.maxCheckpointVisited = 0;
    this.currentLapTime = 0;
    this.totalRaceTime = 0;
    this.raceFinished = false;
    this.displayedProgress = 0;
    this.prevSplineT = 0.0;
    this.finalPosition = null;
  }

  update(delta, playerPos, playerPhysics, aiRacers, trackBuilder = null) {
    if (this.raceFinished) {
      return {
        currentLap: this.totalLaps,
        totalLaps: this.totalLaps,
        position: this.finalPosition || 1,
        progressPct: 100,
        timerText: this.formatTime(this.totalRaceTime),
        currentLapTime: this.formatTime(this.currentLapTime),
        bestLapTime: this.bestLapTime ? this.formatTime(this.bestLapTime) : '--:--.--',
        raceFinished: true
      };
    }

    // Update timers
    const now = performance.now();
    this.currentLapTime = (now - this.lapStartTime) * 0.001;
    this.totalRaceTime += delta;

    // Determine current spline progress coordinate t (0.0 to 1.0)
    let currentSplineT = 0;
    if (trackBuilder && trackBuilder.getClosestTrackInfo) {
      const trackInfo = trackBuilder.getClosestTrackInfo(playerPos);
      currentSplineT = trackInfo.index / trackBuilder.sampleCount;
    } else {
      currentSplineT = this.currentCheckpointIndex / this.checkpointCount;
    }
    currentSplineT = Math.min(1.0, Math.max(0.0, currentSplineT));

    // Handle starting grid boundary wrap:
    // Closed track splines wrap from 1.0 to 0.0 at the start line.
    // Starting grid slots placed behind the start line (e.g. Slot 2, 3, 4) on Lap 1
    // map to spline sample indices near the end of the circuit (currentSplineT > 0.70).
    // Clamp to 0.0 until checkpoint 1 is passed so all grid positions start at 0% instead of 50%.
    if (this.currentLap === 1 && this.maxCheckpointVisited < 2 && currentSplineT > 0.70) {
      currentSplineT = 0.0;
    }

    // Checkpoint proximity tracking
    const nextCpIndex = (this.currentCheckpointIndex + 1) % this.checkpointCount;
    const nextCp = this.checkpoints[nextCpIndex];
    if (nextCp) {
      const distToNext = playerPos.distanceTo(nextCp.pos);
      if (distToNext < nextCp.radius) {
        this.currentCheckpointIndex = nextCpIndex;
        this.maxCheckpointVisited = Math.max(this.maxCheckpointVisited, nextCpIndex);
      }
    }

    // Detect actual finish line crossing (spline coordinates wrapping forward from > 0.70 to < 0.25)
    const passedMajorityOfTrack = this.maxCheckpointVisited >= Math.floor(this.checkpointCount * 0.5);
    const crossedFinishLine = this.prevSplineT > 0.70 && currentSplineT < 0.25 && passedMajorityOfTrack;

    if (crossedFinishLine) {
      this._completeLap();
    }
    this.prevSplineT = currentSplineT;

    // Player progress across the whole race (measured in total laps completed + fraction)
    const lapsCompleted = Math.max(0, this.currentLap - 1);
    const playerProgress = this.raceFinished ? this.totalLaps : (lapsCompleted + currentSplineT);

    // Compute Race Position (1 or 2)
    let position = 1;
    aiRacers.forEach(ai => {
      if (ai.getProgress() > playerProgress) {
        position++;
      }
    });

    if (this.raceFinished) {
      this.finalPosition = position;
    }

    // Continuous full-race progress percentage (0% to 100%)
    let currentProgressPct = 0;
    if (this.raceFinished) {
      currentProgressPct = 100;
      this.displayedProgress = 100;
    } else {
      const overallRatio = (lapsCompleted + currentSplineT) / Math.max(1, this.totalLaps);
      currentProgressPct = Math.min(99, Math.max(0, Math.round(overallRatio * 100)));
      this.displayedProgress = Math.max(this.displayedProgress || 0, currentProgressPct);
    }

    // Render Minimap
    this._renderMinimap(playerPos, playerPhysics.rotationY, aiRacers);

    return {
      currentLap: this.currentLap,
      totalLaps: this.totalLaps,
      position,
      progressPct: this.displayedProgress,
      timerText: this.formatTime(this.totalRaceTime),
      currentLapTime: this.formatTime(this.currentLapTime),
      bestLapTime: this.bestLapTime ? this.formatTime(this.bestLapTime) : '--:--.--',
      raceFinished: this.raceFinished
    };
  }

  _completeLap() {
    if (this.bestLapTime === null || this.currentLapTime < this.bestLapTime) {
      this.bestLapTime = this.currentLapTime;
    }

    if (this.currentLap < this.totalLaps) {
      this.currentLap++;
      this.lapStartTime = performance.now();
      this.currentCheckpointIndex = 0;
      this.maxCheckpointVisited = 0;
    } else {
      this.raceFinished = true;
      this.displayedProgress = 100;
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds * 100) % 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  _renderMinimap(playerPos, playerRotY, aiRacers) {
    if (!this.minimapCtx || !this.minimapCanvas) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Compute dynamic bounding box of current track spline so any layout fits perfectly
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    const probeCount = 48;
    for (let i = 0; i < probeCount; i++) {
      const p = this.trackSpline.getPointAt(i / probeCount);
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }
    const trackSpanX = Math.max(60, maxX - minX);
    const trackSpanZ = Math.max(60, maxZ - minZ);
    const scale = Math.min((w - 24) / trackSpanX, (h - 24) / trackSpanZ);
    const midX = (minX + maxX) / 2;
    const midZ = (minZ + maxZ) / 2;

    const toMap = (pt) => ({
      x: w / 2 + (pt.x - midX) * scale,
      y: h / 2 - (pt.z - midZ) * scale
    });

    // Draw Track Outline Ribbon
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    const samples = 80;
    for (let i = 0; i <= samples; i++) {
      const pt = toMap(this.trackSpline.getPointAt(i / samples));
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.stroke();

    // Start / Finish Line marker
    const sPt = toMap(this.trackSpline.getPointAt(0));
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(sPt.x - 3, sPt.y - 3, 6, 6);

    // Draw AI Rivals (Red / Orange dots)
    aiRacers.forEach(ai => {
      const aiPt = toMap(ai.getPosition());
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(aiPt.x, aiPt.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Player (Glowing Cyan Arrow)
    const pPt = toMap(playerPos);
    ctx.save();
    ctx.translate(pPt.x, pPt.y);
    ctx.rotate(-playerRotY + Math.PI);
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(-5, -5);
    ctx.lineTo(0, -2);
    ctx.lineTo(5, -5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
