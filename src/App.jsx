import { useState, useCallback, useEffect, useRef } from 'react'
import { Leva } from 'leva'
import Scene from './Scene'
import LandingPage from './components/ui/LandingPage'
import MultiplayerLobby from './components/ui/MultiplayerLobby'
import VoiceOverlay from './components/ui/VoiceOverlay'
import DuelPrompt from './components/ui/DuelPrompt'
import DuelHUD from './components/ui/DuelHUD'
import HandCamOverlay from './components/ui/HandCamOverlay'
import { playerState } from './lib/npcStore'
import { duelState } from './lib/duelStore'
import { sendData, setCallbacks, closeMultiplayer } from './lib/multiplayerDuel'
import { startListening, stopListening, stopSpeaking, hasVoiceInput, unlockAudioContext, speak, preloadAudio, playPreloadedAudio } from './lib/speak'

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [playerName, setPlayerName] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState('aj')

  const [nearbyGroup, setNearbyGroup] = useState(null)
  const [nearbyNPC, setNearbyNPC] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState(null)
  const [duelOpponent, setDuelOpponent] = useState(null)
  const [duelKey, setDuelKey] = useState(0)
  const [challengedNPCs, setChallengedNPCs] = useState({})

  // Multiplayer state
  const [mpOpponent, setMpOpponent] = useState({ character: 'aj', name: 'Opponent', isHost: true })
  const mpReceiverRef = useRef(null) // DuelSceneMultiplayer registers its receive fn here

  // ── Landing / hall handlers ──────────────────────────────────────────────

  const handleLandingContinue = useCallback((name) => {
    setPlayerName(name)
    setSelectedCharacter('aj')
    setScreen('game')
  }, [])

  const handlePlayOnline = useCallback((name) => {
    setPlayerName(name)
    setSelectedCharacter('aj')
    setScreen('multiplayer-lobby')
  }, [])

  const handleBackToLanding = useCallback(() => {
    setScreen('landing')
  }, [])

  const handleNearbyGroupChange = useCallback((groupId) => {
    setNearbyGroup(groupId)
    playerState.nearGroup = groupId
    if (!groupId) {
      playerState.lastTranscript = null
      stopSpeaking()
      stopListening()
    }
  }, [])

  const handleNearbyNPCChange = useCallback((npcKey) => {
    setNearbyNPC(npcKey)
  }, [])

  // ── Single-player duel handlers ──────────────────────────────────────────

  const handleExitDuel = useCallback(() => {
    duelState.currentLevel = 1
    setDuelOpponent(null)
    setScreen('game')
  }, [])

  const handleNextLevel = useCallback(() => {
    duelState.currentLevel = Math.min(duelState.currentLevel + 1, 3)
    setDuelKey(k => k + 1)
  }, [])

  // ── Multiplayer handlers ─────────────────────────────────────────────────

  const handleMultiplayerReady = useCallback((oppChar, oppName, isHost) => {
    setMpOpponent({ character: oppChar || 'aj', name: oppName || 'Opponent', isHost: !!isHost })
    // Set up callbacks now so network messages route to the active scene
    setCallbacks({
      onConnected: () => { },
      onData: (msg) => { mpReceiverRef.current?.(msg) },
      onDisconnect: () => {
        // Opponent disconnected — go back to landing
        setScreen('landing')
      },
    })
    setScreen('multiplayer-duel')
  }, [])

  const handleMultiplayerExit = useCallback(() => {
    closeMultiplayer()
    mpReceiverRef.current = null
    setScreen('landing')
  }, [])

  const handleRegisterMpReceiver = useCallback((fn) => {
    mpReceiverRef.current = fn
  }, [])

  const handleMpSend = useCallback((data) => {
    sendData(data)
  }, [])

  // Preload challenge responses in the background
  useEffect(() => {
    preloadAudio("Hahaha you stupid little boy. You will defeat me? You? hahaha", 'villian')
  }, [])

  // V key handler for voice input (hall only)
  useEffect(() => {
    if (screen !== 'game') return

    const onKey = async (e) => {
      if (e.code !== 'KeyV') return
      if (!nearbyGroup || !hasVoiceInput || isListening) return

      e.preventDefault()
      unlockAudioContext()
      setIsListening(true)
      playerState.isListening = true
      stopSpeaking()

      try {
        const text = await startListening()
        setIsListening(false)
        playerState.isListening = false
        if (text) {
          setTranscript(text)
          playerState.lastTranscript = text

          const lowerText = text.toLowerCase()
          if (lowerText.includes('duel') || lowerText.includes('fight') || lowerText.includes('challenge')) {
            if (nearbyNPC) {
              setChallengedNPCs(prev => ({ ...prev, [nearbyNPC]: true }))

              if (nearbyNPC === 'villian') {
                setTimeout(async () => {
                  await playPreloadedAudio("Hahaha you stupid little boy. You will defeat me? You? hahaha", 'villian')
                  setDuelOpponent('villian')
                  setScreen('duel')
                }, 500)
              } else {
                setDuelOpponent(nearbyNPC)
                setScreen('duel')
              }
            }
          }

          setTimeout(() => setTranscript(null), 3000)
        }
      } catch (err) {
        console.warn('Voice error:', err.message)
        setIsListening(false)
        playerState.isListening = false
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen, nearbyGroup, isListening])

  // ESC to exit single-player duel
  useEffect(() => {
    if (screen !== 'duel') return

    const onKey = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        handleExitDuel()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen, handleExitDuel])

  // ESC to exit multiplayer duel
  useEffect(() => {
    if (screen !== 'multiplayer-duel') return

    const onKey = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        handleMultiplayerExit()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen, handleMultiplayerExit])

  // ── Render ───────────────────────────────────────────────────────────────

  if (screen === 'landing') {
    return <LandingPage onContinue={handleLandingContinue} onPlayOnline={handlePlayOnline} />
  }

  if (screen === 'multiplayer-lobby') {
    return (
      <MultiplayerLobby
        playerName={playerName}
        selectedCharacter={selectedCharacter}
        onReady={handleMultiplayerReady}
        onBack={() => setScreen('landing')}
      />
    )
  }

  // Multiplayer duel screen
  if (screen === 'multiplayer-duel') {
    return (
      <>
        <Leva collapsed />
        <Scene
          selectedCharacter={selectedCharacter}
          onNearbyGroupChange={handleNearbyGroupChange}
          onNearbyNPCChange={handleNearbyNPCChange}
          mode="multiplayer"
          duelOpponent={duelOpponent}
          duelKey={duelKey}
          mpOpponentCharacter={mpOpponent.character}
          mpIsHost={mpOpponent.isHost}
          mpSendData={handleMpSend}
          mpOnRegisterReceiver={handleRegisterMpReceiver}
        />
        <DuelHUD opponent={mpOpponent.character} onExit={handleMultiplayerExit} />
        <HandCamOverlay />
      </>
    )
  }

  // Single-player / hall
  const mode = screen === 'duel' ? 'duel' : 'hall'

  return (
    <>
      <Leva collapsed />
      <Scene
        selectedCharacter={selectedCharacter}
        onNearbyGroupChange={handleNearbyGroupChange}
        onNearbyNPCChange={handleNearbyNPCChange}
        mode={mode}
        duelOpponent={duelOpponent}
        duelKey={duelKey}
      />

      {/* Hall overlays */}
      {screen === 'game' && (
        <>
          <VoiceOverlay
            nearbyGroup={nearbyGroup}
            isListening={isListening}
            transcript={transcript}
          />
          {nearbyNPC && (
            <DuelPrompt npcKey={nearbyNPC} isChallenged={challengedNPCs[nearbyNPC]} />
          )}
        </>
      )}

      {/* Single-player duel overlays */}
      {screen === 'duel' && duelOpponent && (
        <>
          <DuelHUD opponent={duelOpponent} onExit={handleExitDuel} onNextLevel={handleNextLevel} />
          <HandCamOverlay />
        </>
      )}
    </>
  )
}
