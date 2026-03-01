import { useState, useEffect, useRef } from 'react'
import { createRoom, joinRoom, setCallbacks, sendData, closeMultiplayer } from '../../lib/multiplayerDuel'

export default function MultiplayerLobby({ playerName, selectedCharacter, onReady, onBack }) {
  const [view, setView] = useState('idle') // 'idle' | 'hosting' | 'joining' | 'waiting' | 'error'
  const [roomCode, setRoomCode] = useState('')
  const [joinInput, setJoinInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const opponentInitRef = useRef(null)
  const connectedRef = useRef(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => closeMultiplayer()
  }, [])

  function handleConnected() {
    connectedRef.current = true
    // Both sides: send init so each knows the other's character + name
    sendData({ type: 'init', character: selectedCharacter, name: playerName })
    // If we already received their init before sending ours, call onReady
    if (opponentInitRef.current) {
      const { character, name } = opponentInitRef.current
      onReady(character, name)
    } else {
      setView('waiting')
    }
  }

  function handleData(msg) {
    if (msg.type === 'init') {
      opponentInitRef.current = msg
      // Use ref instead of stale view state — avoids closure capture bug
      if (connectedRef.current) {
        onReady(msg.character, msg.name)
      }
    }
  }

  function handleDisconnect() {
    setView('error')
    // If we never connected, it's a timeout; otherwise opponent left
    setErrorMsg(connectedRef.current ? 'Opponent disconnected.' : 'Connection timed out. Check room code and try again.')
  }

  async function handleCreateRoom() {
    setView('hosting')
    setCallbacks({ onConnected: handleConnected, onData: handleData, onDisconnect: handleDisconnect })
    try {
      const code = await createRoom()
      setRoomCode(code)
    } catch (err) {
      setView('error')
      setErrorMsg('Could not create room. Check your connection.')
    }
  }

  async function handleJoinRoom() {
    if (!joinInput.trim()) return
    setView('joining')
    setCallbacks({ onConnected: handleConnected, onData: handleData, onDisconnect: handleDisconnect })
    try {
      await joinRoom(joinInput.trim())
    } catch (err) {
      setView('error')
      setErrorMsg('Could not connect. Check the room code.')
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleRetry() {
    closeMultiplayer()
    setView('idle')
    setRoomCode('')
    setJoinInput('')
    setErrorMsg('')
    opponentInitRef.current = null
    connectedRef.current = false
  }

  return (
    <div style={s.overlay}>
      <style>{keyframes}</style>
      <div style={s.stars} />
      <div style={s.glow} />

      <div style={s.card}>
        <div style={s.title}>⚡ PLAY ONLINE ⚡</div>
        <div style={s.subtitle}>1v1 Wizard Duel</div>

        {view === 'idle' && (
          <>
            <button style={s.primaryBtn} onClick={handleCreateRoom}>
              Create Room
            </button>
            <div style={s.divider}>— or —</div>
            <div style={s.joinRow}>
              <input
                style={s.codeInput}
                value={joinInput}
                onChange={e => setJoinInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
                placeholder="Enter room code..."
                autoFocus
              />
              <button
                style={{ ...s.primaryBtn, marginTop: 0, opacity: joinInput.trim() ? 1 : 0.5 }}
                onClick={handleJoinRoom}
              >
                Join
              </button>
            </div>
            <button style={s.backBtn} onClick={onBack}>← Back</button>
          </>
        )}

        {view === 'hosting' && !roomCode && (
          <div style={s.status}>Creating room...</div>
        )}

        {view === 'hosting' && roomCode && (
          <>
            <div style={s.label}>Share this code with your friend:</div>
            <div style={s.codeBox}>
              <span style={s.codeText}>{roomCode}</span>
              <button style={s.copyBtn} onClick={handleCopy}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div style={s.status}>⏳ Waiting for opponent...</div>
            <button style={s.backBtn} onClick={onBack}>← Cancel</button>
          </>
        )}

        {view === 'joining' && (
          <div style={s.status}>Connecting to room...</div>
        )}

        {view === 'waiting' && (
          <div style={s.status}>Connected! Starting duel...</div>
        )}

        {view === 'error' && (
          <>
            <div style={s.errorMsg}>{errorMsg}</div>
            <button style={s.primaryBtn} onClick={handleRetry}>Try Again</button>
            <button style={s.backBtn} onClick={onBack}>← Back</button>
          </>
        )}
      </div>
    </div>
  )
}

const keyframes = `
  @keyframes mpTwinkle {
    0% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0d0d1a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Georgia', serif",
    overflow: 'hidden',
  },
  stars: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(2px 2px at 20% 30%, #c9a53366, transparent),' +
      'radial-gradient(2px 2px at 70% 60%, #c9a53344, transparent),' +
      'radial-gradient(1px 1px at 50% 20%, #c9a53355, transparent),' +
      'radial-gradient(1px 1px at 85% 45%, #c9a53333, transparent),' +
      'radial-gradient(2px 2px at 15% 75%, #c9a53344, transparent)',
    animation: 'mpTwinkle 4s ease-in-out infinite alternate',
    pointerEvents: 'none',
  },
  glow: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,165,51,0.1) 0%, transparent 70%)',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  card: {
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    padding: '40px 48px',
    background: 'rgba(13,13,26,0.85)',
    border: '1px solid #c9a53344',
    borderRadius: 16,
    minWidth: 380,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#c9a533',
    letterSpacing: 4,
    textShadow: '0 0 20px rgba(201,165,51,0.5)',
  },
  subtitle: {
    fontSize: 13,
    color: '#c9a53388',
    letterSpacing: 3,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: '#c9a53399',
    letterSpacing: 1,
  },
  primaryBtn: {
    marginTop: 4,
    padding: '12px 40px',
    background: 'linear-gradient(135deg, #c9a533, #a8872a)',
    border: 'none',
    borderRadius: 8,
    color: '#0d0d1a',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: "'Georgia', serif",
    cursor: 'pointer',
    letterSpacing: 2,
    boxShadow: '0 4px 16px rgba(201,165,51,0.3)',
  },
  backBtn: {
    background: 'transparent',
    border: '1px solid #c9a53344',
    color: '#c9a53388',
    fontFamily: "'Georgia', serif",
    fontSize: 13,
    padding: '8px 20px',
    borderRadius: 6,
    cursor: 'pointer',
    letterSpacing: 1,
    marginTop: 4,
  },
  divider: {
    color: '#c9a53344',
    fontSize: 13,
    letterSpacing: 2,
  },
  joinRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  codeInput: {
    padding: '10px 16px',
    background: 'rgba(13,13,26,0.9)',
    border: '1px solid #c9a53366',
    borderRadius: 6,
    color: '#e8dcc8',
    fontSize: 15,
    fontFamily: "'Georgia', serif",
    outline: 'none',
    letterSpacing: 1,
    width: 220,
    textAlign: 'center',
  },
  codeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    background: 'rgba(201,165,51,0.08)',
    border: '1px solid #c9a53355',
    borderRadius: 8,
  },
  codeText: {
    fontSize: 20,
    color: '#c9a533',
    letterSpacing: 3,
    fontWeight: 'bold',
    wordBreak: 'break-all',
    maxWidth: 260,
    textAlign: 'center',
  },
  copyBtn: {
    background: 'rgba(201,165,51,0.15)',
    border: '1px solid #c9a53355',
    color: '#c9a533',
    fontFamily: "'Georgia', serif",
    fontSize: 13,
    padding: '6px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    letterSpacing: 1,
    whiteSpace: 'nowrap',
  },
  status: {
    fontSize: 15,
    color: '#c9a53399',
    letterSpacing: 1,
    textAlign: 'center',
  },
  errorMsg: {
    fontSize: 14,
    color: '#ff6644',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
  },
}
