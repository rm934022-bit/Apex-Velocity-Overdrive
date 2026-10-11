/**
 * Apex Velocity: Overdrive
 * Real-Time Multiplayer Manager (LAN & Localhost)
 * Handles WebSocket communications, room lobby synchronization,
 * remote 3D supercar rendering, vehicle state interpolation,
 * floating player nametags, and synchronized GTA 5 race starts.
 */

import * as THREE from 'three';
import { CarModelBuilder } from '../cars/CarModelBuilder.js';

export class MultiplayerManager {
  constructor(scene, tireSmokeSystem, crashSparksSystem) {
    this.scene = scene;
    this.tireSmokeSystem = tireSmokeSystem;
    this.crashSparksSystem = crashSparksSystem;

    // WebSocket & Connection State
    this.ws = null;
    this.isConnected = false;
    this.playerId = null;
    this.playerName = 'Racer ' + Math.floor(10 + Math.random() * 90);
    this.selectedCarModel = 'apex_gtr';
    this.selectedColor = 0xdc2020;
    this.room = null;
    this.isHost = false;
    this.slot = 1;

    // Active Remote Racers in 3D Scene (playerId -> racerObject)
    this.remoteRacers = new Map();

    // Telemetry Broadcast Throttle (~30 Hz)
    this.broadcastTimer = 0;
    this.broadcastInterval = 1 / 30;

    // UI Event Callbacks
    this.callbacks = {
      onConnectChange: null,
      onJoined: null,
      onRoomStateChange: null,
      onPlayerJoined: null,
      onPlayerLeft: null,
      onLevelSelected: null,
      onRaceLaunch: null,
      onPlayerFinished: null,
      onAllPlayersFinished: null
    };

    // Auto-connect to local server on instantiation
    this.connect();
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Try same-host Vite plugin port first, fallback to standalone port 3001
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const primaryUrl = `${protocol}//${window.location.host}/multiplayer`;

    this._attemptConnection(primaryUrl, () => {
      // Fallback port 3001 if primary fails
      const fallbackUrl = `ws://${window.location.hostname || 'localhost'}:3001`;
      this._attemptConnection(fallbackUrl);
    });
  }

  _attemptConnection(url, onFail = null) {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        this.ws = ws;
        this.isConnected = true;
        console.log(`[Multiplayer] Connected to server at ${url}`);
        if (this.callbacks.onConnectChange) this.callbacks.onConnectChange(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._handleServerMessage(data);
        } catch (err) {
          console.error('[Multiplayer] Failed to parse incoming packet:', err);
        }
      };

      ws.onerror = () => {
        if (!this.isConnected && onFail) {
          onFail();
        }
      };

      ws.onclose = () => {
        const wasConnected = this.isConnected;
        this.isConnected = false;
        this.ws = null;
        if (wasConnected) {
          console.log('[Multiplayer] Disconnected from server. Reconnecting in 3s...');
          if (this.callbacks.onConnectChange) this.callbacks.onConnectChange(false);
          setTimeout(() => this.connect(), 3000);
        }
      };
    } catch (err) {
      if (onFail) onFail();
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  joinRoom(roomId, name, carModel, color) {
    if (name) this.playerName = name;
    if (carModel) this.selectedCarModel = carModel;
    if (color !== undefined) this.selectedColor = color;

    this.send({
      type: 'JOIN_ROOM',
      roomId: (roomId || 'BHARAT-LOBBY').toUpperCase().trim(),
      name: this.playerName,
      carModel: this.selectedCarModel,
      color: this.selectedColor
    });
  }

  updateProfile(name, carModel, color) {
    if (name) this.playerName = name;
    if (carModel) this.selectedCarModel = carModel;
    if (color !== undefined) this.selectedColor = color;

    this.send({
      type: 'UPDATE_PROFILE',
      name: this.playerName,
      carModel: this.selectedCarModel,
      color: this.selectedColor
    });
  }

  selectLevel(levelId, laps) {
    if (!this.isHost) return;
    this.send({
      type: 'SELECT_LEVEL',
      levelId,
      laps
    });
  }

  startRace() {
    this.send({
      type: 'START_RACE'
    });
  }

  returnToLobby() {
    this.send({
      type: 'RETURN_TO_LOBBY'
    });
  }

  sendPlayerState(physics, checkpointSystem) {
    if (!this.isConnected || !this.room || this.room.state !== 'RACING') return;

    this.send({
      type: 'PLAYER_STATE',
      pos: [physics.position.x, physics.position.y, physics.position.z],
      rotY: physics.rotationY,
      speed: physics.getSpeedKmh(),
      steer: physics.steerAngle,
      isDrifting: physics.isDrifting,
      isBoosting: physics.isBoosting,
      lap: checkpointSystem?.currentLap || 1,
      progressPct: checkpointSystem?.displayedProgress || 0
    });
  }

  sendFinish(time, formattedTime, position) {
    if (!this.isConnected || !this.room) return;
    this.send({
      type: 'FINISH_RACE',
      time,
      formattedTime,
      position
    });
  }

  leaveRoom() {
    this.clearRemoteRacers();
    this.room = null;
    this.isHost = false;
    this.slot = 1;
    this.send({ type: 'LEAVE_ROOM' });
  }

  // --- Message Handling from WebSocket Server ---
  _handleServerMessage(msg) {
    switch (msg.type) {
      case 'START_RACE_FAILED':
        console.warn('[Multiplayer]', msg.reason);
        alert(msg.reason || 'Only the host can launch the race.');
        break;

      case 'JOIN_SUCCESS':
        this.playerId = msg.playerId;
        this.slot = msg.slot;
        this.isHost = msg.isHost;
        this.room = msg.room;
        if (this.callbacks.onJoined) this.callbacks.onJoined(msg);
        if (this.callbacks.onRoomStateChange) this.callbacks.onRoomStateChange(this.room);
        break;

      case 'PLAYER_JOINED':
        if (this.room) {
          this.room.players = msg.players;
          if (this.callbacks.onPlayerJoined) this.callbacks.onPlayerJoined(msg.player);
          if (this.callbacks.onRoomStateChange) this.callbacks.onRoomStateChange(this.room);
        }
        break;

      case 'PLAYER_LEFT':
        if (this.room) {
          this.room.players = msg.players;
          this.room.hostId = msg.newHostId;
          this.isHost = this.room.hostId === this.playerId;
          this.removeRemoteRacer(msg.playerId);
          if (this.callbacks.onPlayerLeft) this.callbacks.onPlayerLeft(msg.playerId);
          if (this.callbacks.onRoomStateChange) this.callbacks.onRoomStateChange(this.room);
        }
        break;

      case 'PROFILE_UPDATED':
        if (this.room) {
          this.room.players = msg.players;
          // Update 3D car visuals if racer already spawned
          const racer = this.remoteRacers.get(msg.playerId);
          if (racer && racer.materials?.matPaint) {
            racer.materials.matPaint.color.setHex(msg.player.color);
          }
          if (this.callbacks.onRoomStateChange) this.callbacks.onRoomStateChange(this.room);
        }
        break;

      case 'LEVEL_SELECTED':
        if (this.room) {
          this.room.levelId = msg.levelId;
          this.room.laps = msg.laps;
          if (this.callbacks.onLevelSelected) this.callbacks.onLevelSelected(msg.levelId, msg.laps);
          if (this.callbacks.onRoomStateChange) this.callbacks.onRoomStateChange(this.room);
        }
        break;

      case 'RACE_LAUNCH':
        if (this.room) {
          this.room.state = 'RACING';
        }
        if (this.callbacks.onRaceLaunch) {
          this.callbacks.onRaceLaunch(msg);
        }
        break;

      case 'REMOTE_PLAYER_STATE':
        this._updateRemoteRacerTarget(msg);
        break;

      case 'PLAYER_FINISHED':
        const finishedRacer = this.remoteRacers.get(msg.playerId);
        if (finishedRacer) {
          finishedRacer.progressPct = 100;
          finishedRacer.isFinished = true;
          finishedRacer.finishTime = msg.formattedTime;
          finishedRacer.position = msg.position;
        }
        if (this.callbacks.onPlayerFinished) {
          this.callbacks.onPlayerFinished(msg);
        }
        break;

      case 'ALL_PLAYERS_FINISHED':
        if (this.callbacks.onAllPlayersFinished) {
          this.callbacks.onAllPlayersFinished(msg);
        }
        break;

      case 'RETURNED_TO_LOBBY':
        if (this.room) {
          this.room.state = 'LOBBY';
          this.clearRemoteRacers();
          if (this.callbacks.onRoomStateChange) this.callbacks.onRoomStateChange(this.room);
        }
        break;
    }
  }

  // --- 3D Remote Supercar Spawning & Management ---
  setupRacersForGrid(gridList, trackSpline) {
    this.clearRemoteRacers();

    const startPt = trackSpline.getPointAt(0);
    const tangent = trackSpline.getTangentAt(0).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const heading = Math.atan2(tangent.x, tangent.z);

    gridList.forEach(p => {
      if (p.id === this.playerId) return; // Skip local player

      const racer = this._createRemoteRacer(p);

      // Stagger starting grid slots:
      // Slot 1: Left Front (x: +2.6, z: 0)
      // Slot 2: Right Front (x: -2.6, z: -3.8)
      // Slot 3: Left Row 2 (x: +2.6, z: -9.5)
      // Slot 4: Right Row 2 (x: -2.6, z: -13.3)
      const isRight = (p.slot % 2 === 0);
      const row = Math.floor((p.slot - 1) / 2);
      const sideOffset = isRight ? -2.6 : 2.6;
      const backOffset = row * 9.5 + (isRight ? 3.8 : 0);

      const spawnPos = startPt.clone()
        .add(normal.clone().multiplyScalar(sideOffset))
        .sub(tangent.clone().multiplyScalar(backOffset));
      spawnPos.y = 0;

      racer.position.copy(spawnPos);
      racer.targetPosition.copy(spawnPos);
      racer.rotationY = heading;
      racer.targetRotationY = heading;

      racer.root.position.copy(spawnPos);
      racer.root.rotation.y = heading;

      this.scene.add(racer.root);
      this.remoteRacers.set(p.id, racer);
      console.log(`[Multiplayer] Spawned 3D rival car for ${p.name} (Slot ${p.slot})`);
    });
  }

  _createRemoteRacer(playerData) {
    const carData = CarModelBuilder.buildCar(
      playerData.carModel || 'apex_gtr',
      playerData.color || 0x00f0ff,
      'cyan'
    );

    // Create 3D Floating Nametag
    const nametag = this._createNametagSprite(playerData.name, playerData.slot);
    nametag.position.set(0, 1.95, 0);
    carData.root.add(nametag);

    const racer = {
      id: playerData.id,
      name: playerData.name,
      slot: playerData.slot,
      root: carData.root,
      wheels: carData.wheels,
      materials: carData.materials,
      exhaustFlames: carData.exhaustFlames,
      nametag,
      position: new THREE.Vector3(),
      targetPosition: new THREE.Vector3(),
      rotationY: 0,
      targetRotationY: 0,
      speed: 0,
      steer: 0,
      isDrifting: false,
      isBoosting: false,
      lap: 1,
      progressPct: 0
    };

    return racer;
  }

  _createNametagSprite(name, slot) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    // Rounded tag background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = slot === 1 ? '#00f0ff' : '#ff0055';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(6, 6, 372, 84, 16);
    ctx.fill();
    ctx.stroke();

    // Slot badge
    ctx.fillStyle = slot === 1 ? '#00f0ff' : '#ff0055';
    ctx.font = 'bold 26px Montserrat, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`P${slot}`, 24, 56);

    // Player name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Montserrat, sans-serif';
    ctx.fillText(name.toUpperCase().substring(0, 14), 85, 56);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.2, 0.8, 1.0);
    return sprite;
  }

  _updateRemoteRacerTarget(state) {
    const racer = this.remoteRacers.get(state.id);
    if (!racer) return;

    if (state.pos) {
      racer.targetPosition.set(state.pos[0], state.pos[1], state.pos[2]);
    }
    if (state.rotY !== undefined) {
      racer.targetRotationY = state.rotY;
    }
    racer.speed = state.speed || 0;
    racer.steer = state.steer || 0;
    racer.isDrifting = !!state.isDrifting;
    racer.isBoosting = !!state.isBoosting;
    racer.lap = state.lap || 1;
    racer.progressPct = state.progressPct || 0;
  }

  // --- Per-Frame Update (Interpolation, Wheels, VFX & Collisions) ---
  update(delta, playerPhysics, camera) {
    // Throttle outbound telemetry broadcast
    this.broadcastTimer += delta;
    if (this.broadcastTimer >= this.broadcastInterval && playerPhysics) {
      this.broadcastTimer = 0;
      this.sendPlayerState(playerPhysics, window.__checkpointSystem);
    }

    if (this.remoteRacers.size === 0) return;

    this.remoteRacers.forEach(racer => {
      // 1. Smooth Position Interpolation
      racer.position.lerp(racer.targetPosition, Math.min(1.0, delta * 16.0));
      racer.root.position.copy(racer.position);

      // 2. Smooth Angular Slerp for Rotation
      let diff = racer.targetRotationY - racer.rotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      racer.rotationY += diff * Math.min(1.0, delta * 14.0);
      racer.root.rotation.y = racer.rotationY;

      // 3. Wheel Spin & Steering Rotation
      const spinSpeed = (racer.speed / 3.6) * delta * 2.8;
      if (racer.wheels) {
        if (racer.wheels.fl?.mesh) racer.wheels.fl.mesh.rotation.x += spinSpeed;
        if (racer.wheels.fr?.mesh) racer.wheels.fr.mesh.rotation.x += spinSpeed;
        if (racer.wheels.rl?.mesh) racer.wheels.rl.mesh.rotation.x += spinSpeed;
        if (racer.wheels.rr?.mesh) racer.wheels.rr.mesh.rotation.x += spinSpeed;

        if (racer.wheels.fl?.pivot) racer.wheels.fl.pivot.rotation.y = racer.steer;
        if (racer.wheels.fr?.pivot) racer.wheels.fr.pivot.rotation.y = racer.steer;
      }

      // 4. Nitro Boost Exhaust Flames
      if (racer.exhaustFlames) {
        racer.exhaustFlames.forEach(f => {
          f.visible = racer.isBoosting;
        });
      }

      // 5. Remote Tire Smoke when Drifting
      if (racer.isDrifting && this.tireSmokeSystem && camera) {
        const rotY = racer.rotationY;
        const carPos = racer.position;
        const backX = -Math.sin(rotY) * 1.35;
        const backZ = -Math.cos(rotY) * 1.35;
        const sideX = Math.cos(rotY) * 0.95;
        const sideZ = -Math.sin(rotY) * 0.95;

        const rlPos = new THREE.Vector3(carPos.x + backX - sideX, 0.15, carPos.z + backZ - sideZ);
        const rrPos = new THREE.Vector3(carPos.x + backX + sideX, 0.15, carPos.z + backZ + sideZ);
        const forwardVel = new THREE.Vector3(Math.sin(rotY) * racer.speed * 0.28, 0, Math.cos(rotY) * racer.speed * 0.28);

        this.tireSmokeSystem.emit(rlPos, forwardVel, 1);
        this.tireSmokeSystem.emit(rrPos, forwardVel, 1);
      }

      // 6. Car-to-Car Physical Collisions (Local Player vs Remote Rival)
      if (playerPhysics) {
        this._checkMultiplayerCollision(playerPhysics, racer);
      }
    });
  }

  _checkMultiplayerCollision(playerPhysics, racer) {
    const pPos = playerPhysics.position;
    const rPos = racer.position;

    const deltaVec = pPos.clone().sub(rPos);
    deltaVec.y = 0;
    const dist = deltaVec.length();
    const minDistance = 2.45;

    if (dist < minDistance && dist > 0.001) {
      const overlap = (minDistance - dist);
      const normal = deltaVec.clone().divideScalar(dist);

      // Bounce apart
      playerPhysics.position.add(normal.clone().multiplyScalar(overlap * 0.7));

      const relSpeed = playerPhysics.speed - racer.speed;
      const impactForce = Math.abs(relSpeed);

      if (impactForce > 4.0 && this.crashSparksSystem) {
        playerPhysics.speed = Math.max(10.0, playerPhysics.speed - relSpeed * 0.35);
        const contactPt = pPos.clone().add(rPos).multiplyScalar(0.5);
        this.crashSparksSystem.emit(contactPt, normal, 16);
      }
    }
  }

  removeRemoteRacer(playerId) {
    if (this.remoteRacers.has(playerId)) {
      const racer = this.remoteRacers.get(playerId);
      this.scene.remove(racer.root);
      this.remoteRacers.delete(playerId);
    }
  }

  clearRemoteRacers() {
    this.remoteRacers.forEach(racer => {
      this.scene.remove(racer.root);
    });
    this.remoteRacers.clear();
  }

  // Returns sorted list of all competitors (including remote players) for real-time race standings
  getStandings(playerProgressPct) {
    const myPct = (playerProgressPct !== undefined && playerProgressPct !== null)
      ? Number(playerProgressPct)
      : (window.__checkpointSystem?.displayedProgress || 0);

    const list = [
      {
        id: this.playerId,
        name: this.playerName || 'YOU',
        progressPct: Math.min(100, Math.max(0, Math.round(myPct))),
        lap: window.__checkpointSystem?.currentLap || 1,
        isLocal: true,
        isFinished: window.__checkpointSystem?.raceFinished || false
      }
    ];

    this.remoteRacers.forEach(r => {
      const remotePct = r.isFinished ? 100 : (r.progressPct || 0);
      list.push({
        id: r.id,
        name: r.name,
        progressPct: Math.min(100, Math.max(0, Math.round(remotePct))),
        lap: r.lap || 1,
        isLocal: false,
        isFinished: !!r.isFinished
      });
    });

    // Rank by isFinished first, then by progressPct descending
    list.sort((a, b) => {
      if (a.isFinished !== b.isFinished) {
        return a.isFinished ? -1 : 1;
      }
      return b.progressPct - a.progressPct;
    });

    return list;
  }
}
