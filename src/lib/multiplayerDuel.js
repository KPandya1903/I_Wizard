// PeerJS-based WebRTC P2P connection for 1v1 multiplayer duel
import Peer from 'peerjs'

const ICE_CONFIG = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  },
}

let peer = null
let conn = null
let onDataCallback = null
let onDisconnectCallback = null
let onConnectedCallback = null

export function setCallbacks({ onConnected, onData, onDisconnect }) {
  onConnectedCallback = onConnected
  onDataCallback = onData
  onDisconnectCallback = onDisconnect
}

export function sendData(data) {
  if (conn && conn.open) {
    conn.send(data)
  }
}

export function closeMultiplayer() {
  onDataCallback = null
  onDisconnectCallback = null
  onConnectedCallback = null
  try { conn?.close() } catch (_) { }
  try { peer?.destroy() } catch (_) { }
  conn = null
  peer = null
}

function attachConn(connection) {
  conn = connection
  conn.on('data', (data) => onDataCallback?.(data))
  conn.on('open', () => onConnectedCallback?.())
  conn.on('close', () => onDisconnectCallback?.())
  conn.on('error', (err) => console.warn('PeerJS conn error:', err))
}

// Host: creates a room and returns the room code (peer ID)
export function createRoom() {
  return new Promise((resolve, reject) => {
    peer = new Peer(undefined, ICE_CONFIG)
    peer.on('open', (id) => resolve(id))
    peer.on('connection', (connection) => attachConn(connection))
    peer.on('error', reject)
  })
}

// Guest: joins a room by code
export function joinRoom(roomCode) {
  return new Promise((resolve, reject) => {
    peer = new Peer(undefined, ICE_CONFIG)
    peer.on('open', () => {
      const connection = peer.connect(roomCode.trim(), { serialization: 'json' })
      attachConn(connection)
      // conn 'open' fires onConnectedCallback via attachConn
      // resolve immediately after connect() call; open fires async
      resolve()
    })
    peer.on('error', reject)
  })
}
