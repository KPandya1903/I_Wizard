// PeerJS-based WebRTC P2P connection for 1v1 multiplayer duel
import Peer from 'peerjs'

const ICE_CONFIG = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Free TURN servers — required for cross-network / strict-NAT play
      { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
    ],
  },
}

let peer = null
let conn = null
let onDataCallback = null
let onDisconnectCallback = null
let onConnectedCallback = null
let connectTimeoutId = null

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
  if (connectTimeoutId) { clearTimeout(connectTimeoutId); connectTimeoutId = null }
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
  let opened = false
  const fireOpen = () => {
    if (!opened) {
      opened = true
      if (connectTimeoutId) { clearTimeout(connectTimeoutId); connectTimeoutId = null }
      console.log('[MP] DataChannel open — calling onConnectedCallback')
      onConnectedCallback?.()
    }
  }

  conn.on('data', (data) => {
    console.log('[MP] data received:', data?.type)
    onDataCallback?.(data)
  })
  conn.on('open', () => { console.log('[MP] conn open event'); fireOpen() })
  conn.on('close', () => { console.log('[MP] conn closed'); onDisconnectCallback?.() })
  conn.on('error', (err) => console.warn('[MP] conn error:', err))

  // PeerJS race: 'open' may have already fired by the time we attach the handler
  if (connection.open) {
    console.log('[MP] connection already open')
    setTimeout(fireOpen, 0)
  }
}

// Host: creates a room and returns the room code (peer ID)
export function createRoom() {
  return new Promise((resolve, reject) => {
    console.log('[MP] createRoom: creating peer...')
    peer = new Peer(undefined, ICE_CONFIG)
    peer.on('open', (id) => { console.log('[MP] host peer open, ID:', id); resolve(id) })
    peer.on('connection', (connection) => {
      console.log('[MP] incoming guest connection')
      attachConn(connection)
    })
    peer.on('error', (err) => { console.error('[MP] peer error:', err); reject(err) })
  })
}

// Guest: joins a room by code
export function joinRoom(roomCode) {
  return new Promise((resolve, reject) => {
    console.log('[MP] joinRoom: connecting to', roomCode)
    peer = new Peer(undefined, ICE_CONFIG)
    peer.on('open', (id) => {
      console.log('[MP] guest peer open, ID:', id, '— calling peer.connect()')
      const connection = peer.connect(roomCode.trim(), { serialization: 'json' })
      attachConn(connection)

      // Timeout: if DataChannel doesn't open within 25s, show error
      connectTimeoutId = setTimeout(() => {
        if (!conn?.open) {
          console.warn('[MP] connection timed out after 25s')
          onDisconnectCallback?.()
        }
      }, 25000)

      resolve()
    })
    peer.on('error', (err) => { console.error('[MP] peer error:', err); reject(err) })
  })
}
