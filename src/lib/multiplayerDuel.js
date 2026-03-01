import { io } from 'socket.io-client'

// Hosted proxy WebSocket server (replace with a real server URL in production)
const SOCKET_SERVER_URL = "https://durhhhntj24zi.cloudfront.net" // Secure AWS CloudFront SSL Proxy

let socket = null
let onDataCallback = null
let onDisconnectCallback = null
let onConnectedCallback = null

export function setCallbacks({ onConnected, onData, onDisconnect }) {
  onConnectedCallback = onConnected
  onDataCallback = onData
  onDisconnectCallback = onDisconnect
}

export function sendData(data) {
  if (socket && socket.connected) {
    socket.emit('game-data', data)
  }
}

export function closeMultiplayer() {
  onDataCallback = null
  onDisconnectCallback = null
  onConnectedCallback = null
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

function initSocketListeners(socketInstance) {
  socketInstance.on('connect', () => {
    console.log('[MP] Socket connected:', socketInstance.id)
  })

  socketInstance.on('guest-joined', (guestId) => {
    console.log('[MP] Guest joined room:', guestId)
    if (onConnectedCallback) onConnectedCallback()
  })

  socketInstance.on('game-data', (data) => {
    if (onDataCallback) onDataCallback(data)
  })

  socketInstance.on('peer-disconnected', () => {
    console.log('[MP] Peer disconnected')
    if (onDisconnectCallback) onDisconnectCallback()
  })

  socketInstance.on('disconnect', () => {
    console.log('[MP] Socket disconnected')
    if (onDisconnectCallback) onDisconnectCallback()
  })
}

// Host: creates a room and returns the room code (socket ID)
export function createRoom() {
  return new Promise((resolve, reject) => {
    console.log('[MP] createRoom: connecting to relay...')
    socket = io(SOCKET_SERVER_URL)

    initSocketListeners(socket)

    socket.on('connect', () => {
      socket.emit('create-room', ({ roomId }) => {
        console.log('[MP] Host room created, ID:', roomId)
        resolve(roomId)
      })
    })

    socket.on('connect_error', (err) => {
      console.error('[MP] Socket error:', err)
      reject(err)
    })
  })
}

// Guest: joins a room by code
export function joinRoom(roomCode) {
  return new Promise((resolve, reject) => {
    console.log('[MP] joinRoom: connecting to relay for room:', roomCode)
    socket = io(SOCKET_SERVER_URL)

    initSocketListeners(socket)

    socket.on('connect', () => {
      socket.emit('join-room', roomCode.trim(), (response) => {
        if (response.error) {
          console.error('[MP] Join error:', response.error)
          reject(new Error(response.error))
        } else {
          console.log('[MP] Guest successfully joined room')
          if (onConnectedCallback) onConnectedCallback()
          resolve()
        }
      })
    })

    socket.on('connect_error', (err) => {
      console.error('[MP] Socket error:', err)
      reject(err)
    })
  })
}

