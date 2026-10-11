/**
 * Apex Velocity: Overdrive - Zero-Dependency Multiplayer WebSocket Server
 * Native RFC 6455 WebSocket implementation built with Node.js standard libraries.
 * Can be run standalone (node server/multiplayerServer.js) or mounted inside Vite.
 */

import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// --- WebSocket Framing Helpers (RFC 6455) ---
export function makeFrame(data) {
  const payload = Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
  const len = payload.length;
  let header;
  if (len <= 125) {
    header = Buffer.from([0x81, len]);
  } else if (len <= 65535) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

export function parseFrames(buffer, onMessage) {
  let offset = 0;
  while (offset + 2 <= buffer.length) {
    const byte0 = buffer[offset];
    const byte1 = buffer[offset + 1];
    const opcode = byte0 & 0x0f;
    const isMasked = (byte1 & 0x80) !== 0;
    let payloadLen = byte1 & 0x7f;
    let headerSize = 2;

    if (payloadLen === 126) {
      if (offset + 4 > buffer.length) break;
      payloadLen = buffer.readUInt16BE(offset + 2);
      headerSize = 4;
    } else if (payloadLen === 127) {
      if (offset + 10 > buffer.length) break;
      payloadLen = Number(buffer.readBigUInt64BE(offset + 2));
      headerSize = 10;
    }

    const maskSize = isMasked ? 4 : 0;
    const totalFrameLen = headerSize + maskSize + payloadLen;
    if (offset + totalFrameLen > buffer.length) break; // Incomplete frame

    const payloadStart = offset + headerSize + maskSize;
    const payload = Buffer.alloc(payloadLen);

    if (isMasked) {
      const mask = buffer.slice(offset + headerSize, offset + headerSize + 4);
      for (let i = 0; i < payloadLen; i++) {
        payload[i] = buffer[payloadStart + i] ^ mask[i % 4];
      }
    } else {
      buffer.copy(payload, 0, payloadStart, payloadStart + payloadLen);
    }

    if (opcode === 0x1) { // Text
      try {
        onMessage(payload.toString('utf8'));
      } catch (err) {
        console.error('Error handling message:', err);
      }
    } else if (opcode === 0x8) { // Close
      return { close: true, rest: buffer.slice(offset + totalFrameLen) };
    }

    offset += totalFrameLen;
  }
  return { close: false, rest: buffer.slice(offset) };
}

// --- Multiplayer Room & Session State ---
const rooms = new Map();

function getOrCreateRoom(roomId) {
  const id = (roomId || 'BHARAT-LOBBY').toUpperCase().trim();
  if (!rooms.has(id)) {
    rooms.set(id, {
      id,
      hostId: null,
      levelId: 1,
      laps: 2,
      state: 'LOBBY',
      players: new Map() // playerId -> playerObj
    });
  }
  return rooms.get(id);
}

function broadcastToRoom(room, message, excludePlayerId = null) {
  const frame = makeFrame(message);
  room.players.forEach(p => {
    if (p.id !== excludePlayerId && p.socket && !p.socket.destroyed) {
      try {
        p.socket.write(frame);
      } catch (e) {}
    }
  });
}

function getSanitizedRoomPlayers(room) {
  const list = [];
  room.players.forEach(p => {
    list.push({
      id: p.id,
      name: p.name,
      carModel: p.carModel,
      color: p.color,
      slot: p.slot,
      isHost: p.id === room.hostId,
      ready: p.ready
    });
  });
  return list;
}

// --- WebSocket Upgrade & Client Protocol Handler ---
export function handleMultiplayerUpgrade(req, socket, head) {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const accept = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n'
  );

  let playerId = 'player_' + Math.random().toString(36).substring(2, 9);
  let currentRoom = null;
  let buffer = Buffer.alloc(0);

  function sendToSelf(msg) {
    if (!socket.destroyed) {
      socket.write(makeFrame(msg));
    }
  }

  socket.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);
    const { close, rest } = parseFrames(buffer, rawText => {
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        return;
      }
      handleClientMessage(data);
    });
    buffer = rest;
    if (close) {
      cleanupClient();
      socket.end();
    }
  });

  socket.on('close', cleanupClient);
  socket.on('error', cleanupClient);

  function cleanupClient() {
    if (!currentRoom) return;
    const room = currentRoom;
    currentRoom = null;

    if (room.players.has(playerId)) {
      const p = room.players.get(playerId);
      room.players.delete(playerId);
      console.log(`[Multiplayer] Player ${p.name} (${playerId}) left room ${room.id}`);

      // If host left, elect new host
      if (room.hostId === playerId && room.players.size > 0) {
        const nextHost = room.players.values().next().value;
        room.hostId = nextHost.id;
        console.log(`[Multiplayer] New host of ${room.id} is ${nextHost.name}`);
      }

      if (room.players.size === 0) {
        rooms.delete(room.id);
        console.log(`[Multiplayer] Room ${room.id} deleted (empty)`);
      } else {
        broadcastToRoom(room, {
          type: 'PLAYER_LEFT',
          playerId,
          newHostId: room.hostId,
          players: getSanitizedRoomPlayers(room)
        });
      }
    }
  }

  function handleClientMessage(msg) {
    switch (msg.type) {
      case 'PING':
        sendToSelf({ type: 'PONG', timestamp: Date.now() });
        break;

      case 'JOIN_ROOM': {
        const roomId = (msg.roomId || 'BHARAT-101').toUpperCase().trim();
        const room = getOrCreateRoom(roomId);

        // If client was already in a different room, clean up previous membership
        if (currentRoom && currentRoom !== room && currentRoom.players.has(playerId)) {
          currentRoom.players.delete(playerId);
          if (currentRoom.hostId === playerId) {
            currentRoom.hostId = currentRoom.players.size > 0 ? currentRoom.players.values().next().value.id : null;
          }
          if (currentRoom.players.size === 0) {
            rooms.delete(currentRoom.id);
          } else {
            broadcastToRoom(currentRoom, {
              type: 'PLAYER_LEFT',
              playerId,
              newHostId: currentRoom.hostId,
              players: getSanitizedRoomPlayers(currentRoom)
            });
          }
        }

        currentRoom = room;

        // Clean out any dead sockets from this room before checking host
        for (const [pid, p] of room.players.entries()) {
          if (!p.socket || p.socket.destroyed || p.socket.writableEnded) {
            room.players.delete(pid);
          }
        }

        // Determine host status reliably:
        // Host if: previously host, OR room has no host, OR host is not in room, OR only player in room
        const isCurrentHost = (room.hostId === playerId);
        const hostMissing = !room.hostId || !room.players.has(room.hostId);
        const isFirst = (room.players.size === 0) || (room.players.size === 1 && room.players.has(playerId));
        const isHost = isCurrentHost || hostMissing || isFirst;

        if (isHost) {
          room.hostId = playerId;
        }

        // Assign grid slot based on current players
        let slot = 1;
        if (room.players.has(playerId)) {
          slot = room.players.get(playerId).slot;
        } else {
          const takenSlots = new Set();
          room.players.forEach(p => takenSlots.add(p.slot));
          while (takenSlots.has(slot)) slot++;
        }

        const playerObj = {
          id: playerId,
          socket,
          name: msg.name || `Racer #${slot}`,
          carModel: msg.carModel || 'apex_gtr',
          color: msg.color || 0x00f0ff,
          slot,
          ready: true
        };

        room.players.set(playerId, playerObj);
        console.log(`[Multiplayer] ${playerObj.name} joined ${room.id} as Slot ${slot} (Host: ${isHost})`);

        // Send confirmation to joining player
        sendToSelf({
          type: 'JOIN_SUCCESS',
          playerId,
          slot,
          isHost,
          room: {
            id: room.id,
            hostId: room.hostId,
            levelId: room.levelId,
            laps: room.laps,
            state: room.state,
            players: getSanitizedRoomPlayers(room)
          }
        });

        // Notify other players
        broadcastToRoom(room, {
          type: 'PLAYER_JOINED',
          player: {
            id: playerObj.id,
            name: playerObj.name,
            carModel: playerObj.carModel,
            color: playerObj.color,
            slot: playerObj.slot,
            isHost
          },
          players: getSanitizedRoomPlayers(room)
        }, playerId);
        break;
      }

      case 'UPDATE_PROFILE': {
        if (!currentRoom || !currentRoom.players.has(playerId)) return;
        const p = currentRoom.players.get(playerId);
        if (msg.name) p.name = msg.name;
        if (msg.carModel) p.carModel = msg.carModel;
        if (msg.color) p.color = msg.color;

        broadcastToRoom(currentRoom, {
          type: 'PROFILE_UPDATED',
          playerId,
          player: {
            id: p.id,
            name: p.name,
            carModel: p.carModel,
            color: p.color,
            slot: p.slot,
            isHost: p.id === currentRoom.hostId
          },
          players: getSanitizedRoomPlayers(currentRoom)
        });
        break;
      }

      case 'SELECT_LEVEL': {
        if (!currentRoom || currentRoom.hostId !== playerId) return;
        currentRoom.levelId = msg.levelId || 1;
        if (msg.laps) currentRoom.laps = msg.laps;

        broadcastToRoom(currentRoom, {
          type: 'LEVEL_SELECTED',
          levelId: currentRoom.levelId,
          laps: currentRoom.laps
        });
        break;
      }

      case 'START_RACE': {
        if (!currentRoom) return;

        // Auto-heal host if missing
        if (!currentRoom.hostId || !currentRoom.players.has(currentRoom.hostId)) {
          currentRoom.hostId = playerId;
        }

        if (currentRoom.hostId !== playerId) {
          console.warn(`[Multiplayer] Non-host player ${playerId} attempted to start race in room ${currentRoom.id}`);
          sendToSelf({
            type: 'START_RACE_FAILED',
            reason: 'Only the room host can launch the race.'
          });
          return;
        }

        currentRoom.state = 'RACING';
        currentRoom.finishedPlayers = new Map();
        if (currentRoom.finishGraceTimer) {
          clearTimeout(currentRoom.finishGraceTimer);
          currentRoom.finishGraceTimer = null;
        }

        const grid = [];
        currentRoom.players.forEach(p => {
          grid.push({
            id: p.id,
            name: p.name,
            carModel: p.carModel,
            color: p.color,
            slot: p.slot
          });
        });

        console.log(`[Multiplayer] Launching race in room ${currentRoom.id} (Level ${currentRoom.levelId}) with ${grid.length} racers`);

        broadcastToRoom(currentRoom, {
          type: 'RACE_LAUNCH',
          levelId: currentRoom.levelId || 1,
          laps: currentRoom.laps || 2,
          grid,
          startTime: Date.now()
        });
        break;
      }

      case 'PLAYER_STATE': {
        if (!currentRoom) return;
        // Broadcast high-frequency vehicle telemetry to other racers
        broadcastToRoom(currentRoom, {
          type: 'REMOTE_PLAYER_STATE',
          id: playerId,
          pos: msg.pos,
          rotY: msg.rotY,
          speed: msg.speed,
          steer: msg.steer,
          isDrifting: msg.isDrifting,
          isBoosting: msg.isBoosting,
          lap: msg.lap,
          progressPct: msg.progressPct
        }, playerId);
        break;
      }

      case 'FINISH_RACE': {
        if (!currentRoom) return;
        if (!currentRoom.finishedPlayers) {
          currentRoom.finishedPlayers = new Map();
        }

        const playerRank = currentRoom.finishedPlayers.size + 1;
        currentRoom.finishedPlayers.set(playerId, {
          id: playerId,
          time: msg.time,
          formattedTime: msg.formattedTime,
          position: playerRank
        });

        const finishedCount = currentRoom.finishedPlayers.size;
        const totalCount = currentRoom.players.size;

        console.log(`[Multiplayer] Player ${playerId} finished in room ${currentRoom.id} (P${playerRank}, ${finishedCount}/${totalCount})`);

        broadcastToRoom(currentRoom, {
          type: 'PLAYER_FINISHED',
          playerId,
          time: msg.time,
          formattedTime: msg.formattedTime,
          position: playerRank,
          finishedCount,
          totalCount
        });

        const triggerAllFinished = () => {
          if (currentRoom.finishGraceTimer) {
            clearTimeout(currentRoom.finishGraceTimer);
            currentRoom.finishGraceTimer = null;
          }

          const results = [];
          currentRoom.players.forEach(p => {
            const fp = currentRoom.finishedPlayers.get(p.id);
            results.push({
              id: p.id,
              name: p.name,
              slot: p.slot,
              time: fp ? fp.time : 999999,
              formattedTime: fp ? fp.formattedTime : 'DNF',
              position: fp ? fp.position : (results.length + 1),
              isFinished: !!fp
            });
          });
          results.sort((a, b) => a.position - b.position);

          const nextLevelId = ((currentRoom.levelId || 1) % 5) + 1;
          console.log(`[Multiplayer] All racers finished in room ${currentRoom.id}. Broadcasting ALL_PLAYERS_FINISHED (nextLevel: ${nextLevelId}).`);

          broadcastToRoom(currentRoom, {
            type: 'ALL_PLAYERS_FINISHED',
            results,
            nextLevelId
          });
        };

        if (finishedCount >= totalCount) {
          triggerAllFinished();
        } else if (!currentRoom.finishGraceTimer) {
          // Grace period timer: if trailing racer doesn't finish within 35s, complete race
          currentRoom.finishGraceTimer = setTimeout(() => {
            if (currentRoom && currentRoom.state === 'RACING') {
              triggerAllFinished();
            }
          }, 35000);
        }
        break;
      }

      case 'RETURN_TO_LOBBY': {
        if (!currentRoom) return;
        currentRoom.state = 'LOBBY';
        currentRoom.finishedPlayers = new Map();
        if (currentRoom.finishGraceTimer) {
          clearTimeout(currentRoom.finishGraceTimer);
          currentRoom.finishGraceTimer = null;
        }
        broadcastToRoom(currentRoom, {
          type: 'RETURNED_TO_LOBBY'
        });
        break;
      }
    }
  }
}

// --- Standalone Server Execution Support ---
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  const PORT = process.env.PORT || 3001;
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Apex Velocity Overdrive Multiplayer WebSocket Server Active');
  });

  server.on('upgrade', (req, socket, head) => {
    handleMultiplayerUpgrade(req, socket, head);
  });

  server.listen(PORT, () => {
    console.log(`🏎️ Apex Velocity Overdrive Multiplayer Server running on ws://localhost:${PORT}`);
  });
}
