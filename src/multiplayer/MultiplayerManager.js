/**
 * Apex Velocity: Overdrive
 * Real-Time Multiplayer Manager (WebRTC P2P + WebSocket Fallback)
 * 
 * Enables zero-server, frictionless party room joining anywhere (Vercel, custom domain, LAN, or local dev):
 * - Automatic Room Host election via WebRTC PeerJS cloud broker (0.peerjs.com)
 * - Ultra-low latency direct DataChannels between racers for telemetry & physics
 * - Real-time lobby synchronization: room code, player list (1/4 to 4/4), host controls
 * - Synchronized circuit & lap selection, simultaneous GTA 5 countdown race launch
 * - High-fidelity 3D supercar rendering, wheel spin, drift smoke, sparks, nametags & live standings
 */

import * as THREE from 'three';
import { CarModelBuilder } from '../cars/CarModelBuilder.js';
import Peer from 'peerjs';

function getPeerClass() {
  if (typeof Peer === 'function') return Peer;
  if (Peer && typeof Peer.Peer === 'function') return Peer.Peer;
  if (Peer && typeof Peer.default === 'function') return Peer.default;
  if (typeof window !== 'undefined' && window.Peer) return window.Peer;
  return Peer;
}

const PEER_CONFIG = {
  host: '0.peerjs.com',
  port: 443,
  path: '/',
  secure: true,
  debug: 1,
  pingInterval: 5000,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ]
  }
};

export class MultiplayerManager {
  constructor(scene, tireSmokeSystem, crashSparksSystem) {
    this.scene = scene;
    this.tireSmokeSystem = tireSmokeSystem;
    this.crashSparksSystem = crashSparksSystem;

    // WebRTC P2P State
    this.peer = null;
    this.hostConnection = null;           // Client -> Host data channel
    this.clientConnections = new Map();   // Host -> Map(playerId -> data channel)
    this.finishedPlayers = [];            // Host finish tracker

    // WebSocket Fallback State (if local server is running)
    this.ws = null;

    // Connection & Profile State
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

    // Outbound Telemetry Throttle (~30 Hz)
    this.broadcastTimer = 0;
    this.broadcastInterval = 1 / 30;

    // Room queue & Reconnect State
    this.desiredRoom = null;
    this.pendingMessages = [];
    this.reconnectTimeout = null;

    // Callbacks
    this.callbacks = {
      onConnectChange: null,
      onJoined: null,
      onJoinFailed: null,
      onRoomStateChange: null,
      onPlayerJoined: null,
      onPlayerLeft: null,
      onLevelSelected: null,
      onRaceLaunch: null,
      onPlayerFinished: null,
      onAllPlayersFinished: null
    };

    // Auto-leave room on tab close / reload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        try { this.leaveRoom(); } catch (e) {}
      });
    }

    // Initialize local server probe in background if available
    this._probeLocalWebSocket();
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // ===========================================================================
  // WEBRTC P2P ROOM JOINING & HOST ELECTION
  // ===========================================================================

  joinRoom(roomId, name, carModel, color) {
    if (name) this.playerName = name;
    if (carModel) this.selectedCarModel = carModel;
    if (color !== undefined) this.selectedColor = color;

    const normalizedRoomId = (roomId || 'BHARAT-101').toUpperCase().trim();
    this.desiredRoom = normalizedRoomId;

    // Clean room code for deterministic host peer ID: apexvo-<cleanCode>-host
    const cleanCode = normalizedRoomId.toLowerCase().replace(/[^a-z0-9]/g, '') || 'lobby';
    const hostPeerId = `apexvo-${cleanCode}-host`;

    // Tear down any previous peer or room connection cleanly
    this._cleanupPeer();

    console.log(`[Multiplayer] Joining room ${normalizedRoomId}... (Host ID candidate: ${hostPeerId})`);

    // If local WebSocket is open, we can try socket join first
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'JOIN_ROOM',
        roomId: normalizedRoomId,
        name: this.playerName,
        carModel: this.selectedCarModel,
        color: this.selectedColor
      });
      return;
    }

    // Default to WebRTC P2P (works 100% online without server)
    this._attemptHost(normalizedRoomId, hostPeerId);
  }

  _cleanupPeer() {
    if (this.clientConnections) {
      this.clientConnections.forEach(conn => {
        try { conn.close(); } catch (e) {}
      });
      this.clientConnections.clear();
    }
    if (this.hostConnection) {
      try { this.hostConnection.close(); } catch (e) {}
      this.hostConnection = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
    this.room = null;
    this.isHost = false;
    this.finishedPlayers = [];
  }

  _attemptHost(normalizedRoomId, hostPeerId) {
    const PeerClass = getPeerClass();
    let peer;
    let handled = false;

    try {
      peer = new PeerClass(hostPeerId, PEER_CONFIG);
    } catch (err) {
      console.warn('[Multiplayer] Failed to initialize host peer constructor:', err);
      this._connectAsClient(normalizedRoomId, hostPeerId);
      return;
    }

    this.peer = peer;

    // Fast 4.5s timeout: if host candidate neither opens nor errors, connect as client
    const claimTimer = setTimeout(() => {
      if (!handled && !this.isConnected) {
        handled = true;
        console.warn('[Multiplayer] Host claim timed out. Falling back to client...');
        try { peer.destroy(); } catch (e) {}
        this._connectAsClient(normalizedRoomId, hostPeerId);
      }
    }, 4500);

    peer.on('open', (id) => {
      if (handled) return;
      handled = true;
      clearTimeout(claimTimer);

      console.log(`[Multiplayer] Successfully registered as ROOM HOST for ${normalizedRoomId} (ID: ${id})`);
      this.isHost = true;
      this.playerId = 'host_' + Math.random().toString(36).substring(2, 8);
      this.slot = 1;
      this.isConnected = true;
      this.clientConnections = new Map();
      this.finishedPlayers = [];

      this.room = {
        id: normalizedRoomId,
        hostId: this.playerId,
        levelId: 1,
        laps: 2,
        state: 'LOBBY',
        players: [
          {
            id: this.playerId,
            name: this.playerName,
            carModel: this.selectedCarModel,
            color: this.selectedColor,
            slot: 1,
            isHost: true,
            ready: true
          }
        ]
      };

      // Listen for incoming guest racers
      peer.on('connection', (conn) => {
        this._handleHostIncomingConnection(conn);
      });

      if (this.callbacks.onConnectChange) {
        this.callbacks.onConnectChange(true);
      }
      if (this.callbacks.onJoined) {
        this.callbacks.onJoined({
          playerId: this.playerId,
          slot: 1,
          isHost: true,
          room: this._getSanitizedRoom()
        });
      }
      if (this.callbacks.onRoomStateChange) {
        this.callbacks.onRoomStateChange(this.room);
      }
    });

    peer.on('error', (err) => {
      if (handled) return;
      handled = true;
      clearTimeout(claimTimer);

      const isTaken = err.type === 'unavailable-id' || (err.message && err.message.toLowerCase().includes('taken'));
      if (isTaken) {
        console.log(`[Multiplayer] Room host already active (${hostPeerId}). Connecting as racer guest...`);
      } else {
        console.warn(`[Multiplayer] Host registration note (${err.type}). Connecting as guest:`, err);
      }

      try { peer.destroy(); } catch (e) {}
      this._connectAsClient(normalizedRoomId, hostPeerId);
    });
  }

  _connectAsClient(normalizedRoomId, hostPeerId, retryCount = 0) {
    const PeerClass = getPeerClass();
    let clientPeer;

    try {
      clientPeer = new PeerClass(PEER_CONFIG);
    } catch (err) {
      console.error('[Multiplayer] Failed to create client peer:', err);
      if (this.callbacks.onJoinFailed) this.callbacks.onJoinFailed('WebRTC Peer initialization failed');
      return;
    }

    this.peer = clientPeer;
    this.isHost = false;
    this.playerId = 'racer_' + Math.random().toString(36).substring(2, 8);

    let clientConn = null;
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved && !this.isConnected) {
        resolved = true;
        console.warn('[Multiplayer] Connection to host timed out.');
        if (retryCount < 2) {
          try { clientPeer.destroy(); } catch (e) {}
          this._connectAsClient(normalizedRoomId, hostPeerId, retryCount + 1);
        } else {
          // If connecting to existing host repeatedly fails, host may have left; try becoming host
          console.log('[Multiplayer] Retrying to claim host role...');
          try { clientPeer.destroy(); } catch (e) {}
          this._attemptHost(normalizedRoomId, hostPeerId);
        }
      }
    }, 6000);

    clientPeer.on('open', (id) => {
      console.log(`[Multiplayer] Guest peer ready (${id}). Connecting to host ${hostPeerId}...`);

      clientConn = clientPeer.connect(hostPeerId, {
        reliable: true
      });
      this.hostConnection = clientConn;

      clientConn.on('open', () => {
        resolved = true;
        clearTimeout(timeout);
        this.isConnected = true;
        console.log(`[Multiplayer] DataChannel established to room host! Sending JOIN_ROOM...`);

        if (this.callbacks.onConnectChange) {
          this.callbacks.onConnectChange(true);
        }

        clientConn.send({
          type: 'JOIN_ROOM',
          roomId: normalizedRoomId,
          playerId: this.playerId,
          name: this.playerName,
          carModel: this.selectedCarModel,
          color: this.selectedColor
        });
      });

      clientConn.on('data', (data) => {
        let msg = data;
        if (typeof msg === 'string') {
          try { msg = JSON.parse(msg); } catch (e) {}
        }
        this._handleServerMessage(msg);
      });

      clientConn.on('close', () => {
        console.warn('[Multiplayer] Disconnected from party host.');
        this.isConnected = false;
        this.hostConnection = null;
        if (this.callbacks.onConnectChange) {
          this.callbacks.onConnectChange(false);
        }
        if (this.room) {
          this.room = null;
          if (this.callbacks.onRoomStateChange) {
            this.callbacks.onRoomStateChange(null);
          }
        }
      });

      clientConn.on('error', (err) => {
        console.error('[Multiplayer] Host connection error:', err);
      });
    });

    clientPeer.on('error', (err) => {
      console.warn('[Multiplayer] Client peer event:', err);
      if (err.type === 'peer-unavailable') {
        clearTimeout(timeout);
        resolved = true;
        console.log('[Multiplayer] Target host was offline. Electing self as host...');
        try { clientPeer.destroy(); } catch (e) {}
        this.peer = null;
        setTimeout(() => {
          this._attemptHost(normalizedRoomId, hostPeerId);
        }, 300);
      }
    });
  }

  // ===========================================================================
  // HOST-SIDE PACKET HANDLING & BROADCASTING
  // ===========================================================================

  _handleHostIncomingConnection(conn) {
    conn.on('data', (data) => {
      let msg = data;
      if (typeof msg === 'string') {
        try { msg = JSON.parse(msg); } catch (e) {}
      }
      this._handleHostReceivedPacket(conn, msg);
    });

    conn.on('close', () => {
      this._handleHostClientDisconnect(conn);
    });

    conn.on('error', (err) => {
      console.warn('[Multiplayer Host] Guest connection error:', err);
      this._handleHostClientDisconnect(conn);
    });
  }

  _handleHostReceivedPacket(conn, msg) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'JOIN_ROOM': {
        if (!this.room) return;

        // Capacity guard: max 4 players
        if (this.room.players.length >= 4) {
          try {
            conn.send({ type: 'JOIN_FAILED', reason: 'Party room is full (max 4 players)' });
            setTimeout(() => { try { conn.close(); } catch (e) {} }, 500);
          } catch (e) {}
          return;
        }

        // Match in progress guard
        if (this.room.state === 'RACING') {
          try {
            conn.send({ type: 'JOIN_FAILED', reason: 'Race already in progress in this room' });
            setTimeout(() => { try { conn.close(); } catch (e) {} }, 500);
          } catch (e) {}
          return;
        }

        // Find first available slot (2, 3, 4)
        const usedSlots = new Set(this.room.players.map(p => p.slot));
        let assignedSlot = 2;
        for (let s = 2; s <= 4; s++) {
          if (!usedSlots.has(s)) {
            assignedSlot = s;
            break;
          }
        }

        const clientPlayerId = msg.playerId || ('player_' + Math.random().toString(36).substring(2, 8));
        const newPlayer = {
          id: clientPlayerId,
          name: (msg.name || 'Racer').trim(),
          carModel: msg.carModel || 'apex_gtr',
          color: msg.color !== undefined ? msg.color : 0x00f0ff,
          slot: assignedSlot,
          isHost: false,
          ready: true
        };

        conn.playerId = clientPlayerId;
        this.clientConnections.set(clientPlayerId, conn);
        this.room.players.push(newPlayer);

        // Send JOIN_SUCCESS to new client
        try {
          conn.send({
            type: 'JOIN_SUCCESS',
            playerId: clientPlayerId,
            slot: assignedSlot,
            isHost: false,
            room: this._getSanitizedRoom()
          });
        } catch (e) {}

        // Broadcast PLAYER_JOINED to existing guests
        this._hostBroadcast({
          type: 'PLAYER_JOINED',
          player: newPlayer,
          players: this._getSanitizedRoom().players
        }, clientPlayerId);

        // Update Host's own view
        if (this.callbacks.onPlayerJoined) {
          this.callbacks.onPlayerJoined(newPlayer);
        }
        if (this.callbacks.onRoomStateChange) {
          this.callbacks.onRoomStateChange(this.room);
        }

        console.log(`[Multiplayer Host] Racer ${newPlayer.name} joined room ${this.room.id} (Slot ${assignedSlot}). Total: ${this.room.players.length}/4`);
        break;
      }

      case 'UPDATE_PROFILE': {
        const p = this.room?.players.find(x => x.id === conn.playerId);
        if (p) {
          if (msg.name) p.name = msg.name;
          if (msg.carModel) p.carModel = msg.carModel;
          if (msg.color !== undefined) p.color = msg.color;

          this._hostBroadcast({
            type: 'PROFILE_UPDATED',
            playerId: p.id,
            player: p,
            players: this._getSanitizedRoom().players
          });

          // Update 3D car visual if spawned
          const racer = this.remoteRacers.get(p.id);
          if (racer && racer.materials?.matPaint) {
            racer.materials.matPaint.color.setHex(p.color);
          }

          if (this.callbacks.onRoomStateChange) {
            this.callbacks.onRoomStateChange(this.room);
          }
        }
        break;
      }

      case 'PLAYER_STATE': {
        const statePacket = {
          type: 'REMOTE_PLAYER_STATE',
          id: conn.playerId,
          pos: msg.pos,
          rotY: msg.rotY,
          speed: msg.speed,
          steer: msg.steer,
          isDrifting: msg.isDrifting,
          isBoosting: msg.isBoosting,
          lap: msg.lap,
          progressPct: msg.progressPct
        };

        // Update in host's 3D scene
        this._updateRemoteRacerTarget(statePacket);

        // Relay telemetry to all other clients
        this._hostBroadcast(statePacket, conn.playerId);
        break;
      }

      case 'FINISH_RACE': {
        this._handlePlayerFinish(conn.playerId, msg.time, msg.formattedTime);
        break;
      }

      case 'RETURN_TO_LOBBY': {
        if (this.room) {
          this.room.state = 'LOBBY';
          this.finishedPlayers = [];
          this._hostBroadcast({ type: 'RETURNED_TO_LOBBY' });
          this._handleServerMessage({ type: 'RETURNED_TO_LOBBY' });
        }
        break;
      }

      case 'LEAVE_ROOM': {
        this._handleHostClientDisconnect(conn);
        break;
      }
    }
  }

  _handleHostClientDisconnect(conn) {
    const pId = conn.playerId;
    if (!pId) return;

    this.clientConnections.delete(pId);
    if (this.room) {
      const idx = this.room.players.findIndex(p => p.id === pId);
      if (idx !== -1) {
        const removed = this.room.players.splice(idx, 1)[0];
        console.log(`[Multiplayer Host] Racer ${removed.name} left the room.`);

        // Auto-reset state to LOBBY if room was RACING and only host remains
        if (this.room.state === 'RACING' && this.room.players.length <= 1) {
          this.room.state = 'LOBBY';
        }

        this._hostBroadcast({
          type: 'PLAYER_LEFT',
          playerId: pId,
          players: this._getSanitizedRoom().players,
          newHostId: this.room.hostId
        });

        this.removeRemoteRacer(pId);
        if (this.callbacks.onPlayerLeft) {
          this.callbacks.onPlayerLeft(pId);
        }
        if (this.callbacks.onRoomStateChange) {
          this.callbacks.onRoomStateChange(this.room);
        }
      }
    }
  }

  _handlePlayerFinish(playerId, time, formattedTime) {
    if (!this.room || !this.finishedPlayers) this.finishedPlayers = [];
    if (this.finishedPlayers.find(p => p.id === playerId)) return;

    const position = this.finishedPlayers.length + 1;
    const playerObj = this.room.players.find(p => p.id === playerId);
    const racerResult = {
      id: playerId,
      name: playerObj?.name || 'Racer',
      slot: playerObj?.slot || 1,
      position,
      time,
      formattedTime: formattedTime || '0:00.00'
    };

    this.finishedPlayers.push(racerResult);

    const finishMsg = {
      type: 'PLAYER_FINISHED',
      playerId,
      formattedTime,
      position,
      finishedCount: this.finishedPlayers.length,
      totalCount: this.room.players.length
    };

    this._hostBroadcast(finishMsg);
    this._handleServerMessage(finishMsg);

    // If all players in room crossed the finish line, broadcast final podium
    if (this.finishedPlayers.length >= this.room.players.length) {
      const allFinishedMsg = {
        type: 'ALL_PLAYERS_FINISHED',
        results: {
          isMultiplayer: true,
          position: this.finishedPlayers.find(p => p.id === this.playerId)?.position || 1,
          totalTime: formattedTime,
          bestLapTime: formattedTime,
          standings: this.finishedPlayers,
          nextLevelId: ((this.room.levelId || 1) % 5) + 1
        }
      };
      this._hostBroadcast(allFinishedMsg);
      this._handleServerMessage(allFinishedMsg);
    }
  }

  _hostBroadcast(packet, excludePlayerId = null) {
    if (!this.clientConnections) return;
    this.clientConnections.forEach((conn, pId) => {
      if (pId !== excludePlayerId && conn && conn.open) {
        try {
          conn.send(packet);
        } catch (e) {
          console.warn(`[Multiplayer Host] Failed to send to ${pId}:`, e);
        }
      }
    });
  }

  _getSanitizedRoom() {
    if (!this.room) return null;
    return {
      id: this.room.id,
      hostId: this.room.hostId,
      levelId: this.room.levelId || 1,
      laps: this.room.laps || 2,
      state: this.room.state || 'LOBBY',
      players: this.room.players.map(p => ({
        id: p.id,
        name: p.name,
        carModel: p.carModel,
        color: p.color,
        slot: p.slot,
        isHost: p.id === this.room.hostId,
        ready: p.ready
      }))
    };
  }

  // ===========================================================================
  // OUTBOUND ACTION DISPATCHER
  // ===========================================================================

  send(data) {
    // 1. Host handling
    if (this.isHost) {
      if (data.type === 'SELECT_LEVEL') {
        if (this.room) {
          this.room.levelId = data.levelId;
          this.room.laps = data.laps;
          this._hostBroadcast({
            type: 'LEVEL_SELECTED',
            levelId: data.levelId,
            laps: data.laps
          });
          if (this.callbacks.onRoomStateChange) {
            this.callbacks.onRoomStateChange(this.room);
          }
        }
      } else if (data.type === 'START_RACE') {
        if (this.room) {
          this.room.state = 'RACING';
          this.finishedPlayers = [];

          const launchMsg = {
            type: 'RACE_LAUNCH',
            grid: this._getSanitizedRoom().players,
            levelId: this.room.levelId || 1,
            laps: this.room.laps || 2,
            timestamp: Date.now()
          };

          this._hostBroadcast(launchMsg);
          this._handleServerMessage(launchMsg);
        }
      } else if (data.type === 'RETURN_TO_LOBBY') {
        if (this.room) {
          this.room.state = 'LOBBY';
          this.finishedPlayers = [];
          this._hostBroadcast({ type: 'RETURNED_TO_LOBBY' });
          this._handleServerMessage({ type: 'RETURNED_TO_LOBBY' });
        }
      } else if (data.type === 'PLAYER_STATE') {
        const statePacket = {
          type: 'REMOTE_PLAYER_STATE',
          id: this.playerId,
          pos: data.pos,
          rotY: data.rotY,
          speed: data.speed,
          steer: data.steer,
          isDrifting: data.isDrifting,
          isBoosting: data.isBoosting,
          lap: data.lap,
          progressPct: data.progressPct
        };
        this._hostBroadcast(statePacket);
      } else if (data.type === 'FINISH_RACE') {
        this._handlePlayerFinish(this.playerId, data.time, data.formattedTime);
      } else if (data.type === 'UPDATE_PROFILE') {
        const p = this.room?.players.find(x => x.id === this.playerId);
        if (p) {
          if (data.name) p.name = data.name;
          if (data.carModel) p.carModel = data.carModel;
          if (data.color !== undefined) p.color = data.color;

          this._hostBroadcast({
            type: 'PROFILE_UPDATED',
            playerId: this.playerId,
            player: p,
            players: this._getSanitizedRoom().players
          });
          if (this.callbacks.onRoomStateChange) {
            this.callbacks.onRoomStateChange(this.room);
          }
        }
      }
      return;
    }

    // 2. Client sending via WebRTC DataChannel
    if (this.hostConnection && this.hostConnection.open) {
      try {
        this.hostConnection.send(data);
      } catch (err) {
        console.warn('[Multiplayer] Failed to send packet to host:', err);
      }
      return;
    }

    // 3. Fallback if WebSocket is open
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return;
    }

    // Queue packets if connecting
    if (data.type === 'JOIN_ROOM' || data.type === 'SELECT_LEVEL' || data.type === 'START_RACE') {
      this.pendingMessages.push(data);
    }
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

    if (this.isHost) {
      this._hostBroadcast({ type: 'LEFT_ROOM' });
      if (this.clientConnections) {
        this.clientConnections.forEach(c => {
          try { c.close(); } catch (e) {}
        });
        this.clientConnections.clear();
      }
    } else if (this.hostConnection && this.hostConnection.open) {
      try {
        this.hostConnection.send({ type: 'LEAVE_ROOM' });
        this.hostConnection.close();
      } catch (e) {}
      this.hostConnection = null;
    }

    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }

    this.room = null;
    this.desiredRoom = null;
    this.isHost = false;
    this.slot = 1;
    this.isConnected = false;

    if (this.callbacks.onConnectChange) {
      this.callbacks.onConnectChange(false);
    }
    if (this.callbacks.onRoomStateChange) {
      this.callbacks.onRoomStateChange(null);
    }
  }

  // ===========================================================================
  // MESSAGE RECEIVER (HANDLES BOTH HOST AND CLIENT INCOMING PACKETS)
  // ===========================================================================

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
        this.desiredRoom = msg.room.id;
        this.clearRemoteRacers();
        if (this.callbacks.onJoined) this.callbacks.onJoined(msg);
        if (this.callbacks.onRoomStateChange) this.callbacks.onRoomStateChange(this.room);
        break;

      case 'JOIN_FAILED':
        console.warn('[Multiplayer] Join failed:', msg.reason);
        if (this.callbacks.onJoinFailed) {
          this.callbacks.onJoinFailed(msg.reason);
        } else {
          alert(msg.reason);
        }
        break;

      case 'LEFT_ROOM':
        this.room = null;
        this.desiredRoom = null;
        this.clearRemoteRacers();
        if (this.callbacks.onRoomStateChange) this.callbacks.onRoomStateChange(null);
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
          // Update 3D car paint if racer already spawned
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

  // ===========================================================================
  // OPTIONAL LOCAL WEBSOCKET PROBE (STANDALONE SERVER / DEV)
  // ===========================================================================

  _probeLocalWebSocket() {
    if (typeof window === 'undefined') return;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/multiplayer`);
      ws.onopen = () => {
        this.ws = ws;
        this.isConnected = true;
        console.log('[Multiplayer] Local WebSocket server connected.');
        if (this.callbacks.onConnectChange) this.callbacks.onConnectChange(true);
      };
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          this._handleServerMessage(d);
        } catch (err) {}
      };
      ws.onerror = () => {
        try { ws.close(); } catch (e) {}
      };
    } catch (e) {}
  }

  // ===========================================================================
  // 3D REMOTE SUPERCAR SPAWNING, VISUALS & NAMETAGS
  // ===========================================================================

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

    // 3D Floating Nametag Sprite
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

  // ===========================================================================
  // PER-FRAME INTERPOLATION, WHEELS, VFX & COLLISION PHYSICS
  // ===========================================================================

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

  // Real-time race standings calculation
  getStandings(playerProgressPct) {
    const ck = typeof window !== 'undefined' ? window.__checkpointSystem : null;
    const myPct = (playerProgressPct !== undefined && playerProgressPct !== null)
      ? Number(playerProgressPct)
      : (ck?.displayedProgress || 0);

    const list = [
      {
        id: this.playerId,
        name: this.playerName || 'YOU',
        progressPct: Math.min(100, Math.max(0, Math.round(myPct))),
        lap: ck?.currentLap || 1,
        isLocal: true,
        isFinished: ck?.raceFinished || false
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

    list.sort((a, b) => {
      if (a.isFinished !== b.isFinished) {
        return a.isFinished ? -1 : 1;
      }
      return b.progressPct - a.progressPct;
    });

    return list;
  }
}
