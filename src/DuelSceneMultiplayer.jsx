import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Trail } from '@react-three/drei'
import * as THREE from 'three'
import { useControls } from 'leva'
import DuelArena from './components/duel/DuelArena'
import DuelLighting from './components/duel/DuelLighting'
import DuelEffects from './components/duel/DuelEffects'
import DuelWand from './components/duel/DuelWand'
import GameCharacter from './components/GameCharacter'
import { CHARACTER_CONFIGS } from './data/characterConfigs'
import { duelState } from './lib/duelStore'
import { stopSpeaking } from './lib/speak'
import { handState } from './lib/handTracker'

// ── Reuse the same SPELL_DEFS and voice map from DuelScene ──────────────────
export const SPELL_DEFS_MP = {
  e: { name: 'Stupefy', color: '#3399ff', lightColor: '#66bbff', damage: 25, cooldown: 1.0, speed: 22, size: 0.15 },
  r: { name: 'Avada Kedavra', color: '#00ee44', lightColor: '#44ff88', damage: 45, cooldown: 5.0, speed: 28, size: 0.22 },
  f: { name: 'Protego', color: '#aaaaff', lightColor: '#ccddff', isShield: true, duration: 3.0, cooldown: 8.0 },
}

const VOICE_SPELL_MAP = [
  { key: 'r', patterns: ['avada', 'kedavra', 'cadaver', 'abra', 'kadabra', 'avenger', 'arvada', 'cada', 'kedav', 'cadav', 'avad', 'vodka', 'avocado'] },
  { key: 'e', patterns: ['stupe', 'stupefy', 'stupid', 'stupify', 'stun', 'stumpy', 'stuff', 'stop', 'super', 'soupy'] },
  { key: 'f', patterns: ['protego', 'protect', 'shield', 'defense', 'guard', 'block', 'potato', 'pro', 'tego'] },
]

function matchSpellFromTranscript(text) {
  const lower = text.toLowerCase().trim()
  for (const { key, patterns } of VOICE_SPELL_MAP) {
    for (const p of patterns) {
      if (lower.includes(p)) return key
    }
  }
  return null
}

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

const ARENA_RADIUS = 18
const WALK_SPEED = 5
const HAND_Y = 1.05
const CAM_HEIGHT = 2.5
const CAM_DIST = 3.5
const JUMP_VEL = 10
const GRAVITY = -25

const GESTURE_SPELL = { fist: 'f', open: 'e', peace: 'r' }
const duelKeys = {}

// ── Camera: close third-person behind local player ────────────────────────
function DuelCamera({ playerRef, opponentRef }) {
  const { camera } = useThree()
  useFrame(() => {
    const pp = playerRef.current
    const op = opponentRef.current
    const angle = Math.atan2(op.x - pp.x, op.z - pp.z)
    const camX = pp.x - Math.sin(angle) * CAM_DIST
    const camZ = pp.z - Math.cos(angle) * CAM_DIST
    const camY = (pp.y || 0) + CAM_HEIGHT
    camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.1)
    const lookX = (pp.x + op.x) / 2
    const lookZ = (pp.z + op.z) / 2
    camera.lookAt(new THREE.Vector3(lookX, 1.0, lookZ))
  })
  return null
}

// ── Spell projectile ──────────────────────────────────────────────────────
function SpellProjectile({ id, origin, dirArr, color, lightColor, speed, size, damage, caster, playerRef, opponentRef, onHit }) {
  const groupRef = useRef()
  const pos = useRef(new THREE.Vector3(...origin))
  const dir = useMemo(() => new THREE.Vector3(...dirArr), [])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    pos.current.addScaledVector(dir, speed * delta)
    groupRef.current.position.copy(pos.current)
    const targetPos = caster === 'player'
      ? new THREE.Vector3(opponentRef.current.x, HAND_Y, opponentRef.current.z)
      : new THREE.Vector3(playerRef.current.x, HAND_Y, playerRef.current.z)
    const dist = pos.current.distanceTo(targetPos)
    if (dist < 1.1 || pos.current.length() > 45) {
      onHit(id, caster, dist < 1.1, pos.current.toArray(), damage, color)
    }
  })

  return (
    <group ref={groupRef} position={origin}>
      <Trail width={size * 4} length={10} color={color} attenuation={t => t * t * t}>
        <mesh>
          <sphereGeometry args={[size, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={8} toneMapped={false} />
        </mesh>
      </Trail>
      <pointLight color={lightColor} intensity={60} distance={10} decay={2} />
    </group>
  )
}

// ── Hit burst ring ────────────────────────────────────────────────────────
function HitBurst({ id, position, color, onDone }) {
  const ringRef = useRef()
  const flashRef = useRef()
  const prog = useRef(0)

  useFrame((_, delta) => {
    prog.current += delta * 2.5
    const t = prog.current
    if (ringRef.current) {
      ringRef.current.scale.setScalar(t * 2.5)
      ringRef.current.material.opacity = Math.max(0, 1 - t)
    }
    if (flashRef.current) {
      flashRef.current.material.opacity = Math.max(0, 0.7 - t * 2)
    }
    if (t >= 1.2) onDone(id)
  })

  return (
    <group position={position}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.07, 8, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} transparent opacity={1} toneMapped={false} />
      </mesh>
      <mesh ref={flashRef}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} transparent opacity={0.7} toneMapped={false} />
      </mesh>
      <pointLight color={color} intensity={120} distance={8} decay={2} />
    </group>
  )
}

// ── Main multiplayer scene ────────────────────────────────────────────────
export default function DuelSceneMultiplayer({ selectedCharacter, opponentCharacter, isHost, sendData, onRegisterReceiver }) {
  // Host starts at z=+8 (far side), guest starts at z=-8 (near side)
  // Without this, both players share the same starting position and aim at themselves
  const myStartZ = isHost ? 8 : -8
  const opStartZ = isHost ? -8 : 8

  const playerHeight = CHARACTER_CONFIGS[selectedCharacter]?.height || 1.8
  const opponentHeight = CHARACTER_CONFIGS[opponentCharacter]?.height || 1.8

  const { wandPosX, wandPosY, wandPosZ, wandRotX, wandRotY, wandRotZ } = useControls('Wand Tweaks', {
    wandPosX: { value: 0, min: -0.5, max: 0.5, step: 0.01 },
    wandPosY: { value: 0, min: -0.5, max: 0.5, step: 0.01 },
    wandPosZ: { value: 0.08, min: -0.5, max: 0.5, step: 0.01 },
    wandRotX: { value: 1.5, min: -Math.PI, max: Math.PI, step: 0.05 },
    wandRotY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.05 },
    wandRotZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.05 },
  })

  const playerGroupRef = useRef()
  const opponentGroupRef = useRef()
  const playerPosRef = useRef(new THREE.Vector3(0, 0, myStartZ))
  const opponentPosRef = useRef(new THREE.Vector3(0, 0, opStartZ))
  const playerVelocityYRef = useRef(0)
  const playerGroundedRef = useRef(true)
  const cooldownsRef = useRef({ q: 0, e: 0, r: 0, f: 0 })
  const playerHPRef = useRef(100)
  const opponentHPRef = useRef(100)
  const gameResultRef = useRef(null)
  const playerShieldRef = useRef(0)
  const winTimerRef = useRef(0)
  const frameCounterRef = useRef(0)
  const resultSentRef = useRef(false)

  const [playerAnimState, setPlayerAnimState] = useState('idle')
  const [opponentAnimState, setOpponentAnimState] = useState('idle')
  const [playerSpells, setPlayerSpells] = useState([])
  const [opponentSpells, setOpponentSpells] = useState([])
  const [hitEffects, setHitEffects] = useState([])
  const [playerCastTrigger, setPlayerCastTrigger] = useState(0)
  const [opponentCastTrigger, setOpponentCastTrigger] = useState(0)

  // Reset on mount
  useEffect(() => {
    stopSpeaking()
    duelState.playerHP = 100
    duelState.opponentHP = 100
    duelState.opponentMaxHP = 100
    duelState.gameResult = null
    duelState.cooldowns = { q: 0, e: 0, r: 0, f: 0 }
    playerHPRef.current = 100
    opponentHPRef.current = 100
    gameResultRef.current = null
    playerShieldRef.current = 0
    resultSentRef.current = false
    return () => {
      duelState.playerHP = 100
      duelState.opponentHP = 100
      duelState.gameResult = null
    }
  }, [])

  // Register the network receive handler with parent (App.jsx)
  useEffect(() => {
    onRegisterReceiver?.((msg) => {
      if (msg.type === 'pos') {
        opponentPosRef.current.set(msg.x, msg.y, msg.z)
        if (msg.anim) setOpponentAnimState(msg.anim)
      } else if (msg.type === 'spell') {
        const def = SPELL_DEFS_MP[msg.spellKey]
        if (def) {
          setOpponentCastTrigger(Date.now())
          setOpponentSpells(prev => [...prev, {
            id: msg.id,
            origin: msg.origin,
            dirArr: msg.dirArr,
            caster: 'opponent',
            damage: def.damage,
            color: def.color,
            lightColor: def.lightColor,
            speed: def.speed,
            size: def.size,
          }])
        }
      } else if (msg.type === 'hit') {
        // Opponent says their spell hit us — apply damage
        if (!gameResultRef.current && winTimerRef.current <= 0) {
          if (playerShieldRef.current > 0) {
            // Shield blocked it
          } else {
            playerHPRef.current = Math.max(0, playerHPRef.current - msg.damage)
            duelState.playerHP = playerHPRef.current
            if (playerHPRef.current <= 0) {
              setPlayerAnimState('dying')
              winTimerRef.current = 3.0
              gameResultRef.current = 'lose'
            }
          }
        }
      } else if (msg.type === 'result') {
        // Opponent confirms we won or they lost
        if (!gameResultRef.current) {
          gameResultRef.current = msg.winner === 'opponent' ? 'lose' : 'win'
          winTimerRef.current = 3.0
          if (gameResultRef.current === 'lose') setPlayerAnimState('dying')
          else setOpponentAnimState('dying')
        }
      }
    })
  }, [onRegisterReceiver])

  // Keyboard tracking
  useEffect(() => {
    const dn = e => { duelKeys[e.code] = true }
    const up = e => { duelKeys[e.code] = false }
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', dn)
      window.removeEventListener('keyup', up)
      Object.keys(duelKeys).forEach(k => { duelKeys[k] = false })
    }
  }, [])

  // Cast spells (local player)
  const castPlayerSpell = useCallback((key) => {
    if (gameResultRef.current || cooldownsRef.current[key] > 0) return
    const def = SPELL_DEFS_MP[key]
    if (!def) return
    cooldownsRef.current[key] = def.cooldown

    const pp = playerPosRef.current
    const op = opponentPosRef.current
    const origin = [pp.x + 0.3, HAND_Y, pp.z]
    const dir = new THREE.Vector3(op.x - origin[0], 0, op.z - origin[2]).normalize().toArray()
    const id = Date.now()

    setPlayerCastTrigger(id)

    if (def.isShield) {
      playerShieldRef.current = def.duration
    } else {
      setPlayerSpells(prev => [...prev, { id, origin, dirArr: dir, caster: 'player', ...def }])
      // Broadcast spell to opponent so they can render it
      sendData?.({ type: 'spell', id, origin, dirArr: dir, spellKey: key })
    }
  }, [sendData])

  // E / R / F keys
  useEffect(() => {
    const onKey = e => {
      if (e.code === 'KeyE') castPlayerSpell('e')
      else if (e.code === 'KeyR') castPlayerSpell('r')
      else if (e.code === 'KeyF') castPlayerSpell('f')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [castPlayerSpell])

  // Gesture casting
  const lastGestureRef = useRef(null)
  const gestureCooldownRef = useRef(0)

  useEffect(() => {
    let frameId
    function checkGesture() {
      if (handState.active && handState.gesture) {
        const gesture = handState.gesture
        const spellKey = GESTURE_SPELL[gesture]
        if (gesture === 'fist') {
          if (cooldownsRef.current.f <= 0) {
            playerShieldRef.current = 0.5
            if (lastGestureRef.current !== 'fist') setPlayerCastTrigger(Date.now())
          }
        } else if (spellKey && gesture !== lastGestureRef.current && Date.now() > gestureCooldownRef.current) {
          castPlayerSpell(spellKey)
          gestureCooldownRef.current = Date.now() + 1000
        }
        lastGestureRef.current = gesture
      } else {
        if (lastGestureRef.current === 'fist') cooldownsRef.current.f = SPELL_DEFS_MP.f.cooldown
        lastGestureRef.current = null
      }
      frameId = requestAnimationFrame(checkGesture)
    }
    checkGesture()
    return () => cancelAnimationFrame(frameId)
  }, [castPlayerSpell])

  // Voice spell casting
  const [voiceStatus, setVoiceStatus] = useState(null)
  const voiceActiveRef = useRef(false)

  useEffect(() => {
    if (!SpeechRecognition) return
    let recognizer = null

    const onKeyDown = (e) => {
      if (e.code !== 'KeyV' || voiceActiveRef.current || gameResultRef.current) return
      e.preventDefault()
      voiceActiveRef.current = true

      recognizer = new SpeechRecognition()
      recognizer.lang = 'en-US'
      recognizer.interimResults = true
      recognizer.continuous = false
      recognizer.maxAlternatives = 3

      recognizer.onstart = () => setVoiceStatus('🎤 Listening...')
      recognizer.onresult = (event) => {
        const text = event.results[event.results.length - 1][0].transcript
        const spellKeys = ['e', 'r', 'f']
        const matched = matchSpellFromTranscript(text)
        const spellKey = (matched && SPELL_DEFS_MP[matched]) ? matched : spellKeys[Math.floor(Math.random() * spellKeys.length)]
        setVoiceStatus(`🪄 ${SPELL_DEFS_MP[spellKey].name}!`)
        castPlayerSpell(spellKey)
        setTimeout(() => setVoiceStatus(null), 1200)
      }
      recognizer.onerror = () => setVoiceStatus(null)
      recognizer.onend = () => { voiceActiveRef.current = false; recognizer = null }
      try { recognizer.start() } catch (_) { voiceActiveRef.current = false }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (recognizer) { try { recognizer.abort() } catch (_) { } }
      voiceActiveRef.current = false
      setVoiceStatus(null)
    }
  }, [castPlayerSpell])

  // Hit resolution
  const handleHit = useCallback((id, caster, isHit, hitPos, damage, color) => {
    if (caster === 'player') {
      setPlayerSpells(prev => prev.filter(s => s.id !== id))
      if (isHit && !gameResultRef.current && winTimerRef.current <= 0) {
        // Notify opponent that our spell hit them
        sendData?.({ type: 'hit', damage })
        // Update local opponent HP for display
        opponentHPRef.current = Math.max(0, opponentHPRef.current - damage)
        duelState.opponentHP = opponentHPRef.current
        if (opponentHPRef.current <= 0 && !resultSentRef.current) {
          resultSentRef.current = true
          setOpponentAnimState('dying')
          winTimerRef.current = 3.0
          gameResultRef.current = 'win'
          sendData?.({ type: 'result', winner: 'player' })
        }
      }
    } else {
      // Opponent spell: remove and show effect, but NO local damage (network handles it)
      setOpponentSpells(prev => prev.filter(s => s.id !== id))
    }
    if (isHit) {
      setHitEffects(prev => [...prev, { id: Date.now() + Math.random(), position: hitPos, color }])
    }
  }, [sendData])

  const removeEffect = useCallback(id => setHitEffects(prev => prev.filter(e => e.id !== id)), [])

  // Per-frame game loop
  useFrame((_, delta) => {
    // Handle match end delay
    if (winTimerRef.current > 0) {
      winTimerRef.current -= delta
      if (winTimerRef.current <= 0 && gameResultRef.current) {
        duelState.gameResult = gameResultRef.current
      }
      return
    }

    if (gameResultRef.current && duelState.gameResult) return

    // Player movement
    const pp = playerPosRef.current
    const mv = duelKeys['KeyW'] || duelKeys['KeyS'] || duelKeys['KeyA'] || duelKeys['KeyD'] ||
      duelKeys['ArrowUp'] || duelKeys['ArrowDown'] || duelKeys['ArrowLeft'] || duelKeys['ArrowRight']
    if (duelKeys['KeyW'] || duelKeys['ArrowUp']) pp.z -= WALK_SPEED * delta
    if (duelKeys['KeyS'] || duelKeys['ArrowDown']) pp.z += WALK_SPEED * delta
    if (duelKeys['KeyA'] || duelKeys['ArrowLeft']) pp.x -= WALK_SPEED * delta
    if (duelKeys['KeyD'] || duelKeys['ArrowRight']) pp.x += WALK_SPEED * delta
    const pr = Math.sqrt(pp.x * pp.x + pp.z * pp.z)
    if (pr > ARENA_RADIUS) { pp.x *= ARENA_RADIUS / pr; pp.z *= ARENA_RADIUS / pr }

    // Player jump
    if (duelKeys['Space'] && playerGroundedRef.current) {
      playerVelocityYRef.current = JUMP_VEL
      playerGroundedRef.current = false
    }
    playerVelocityYRef.current += GRAVITY * delta
    pp.y = (pp.y || 0) + playerVelocityYRef.current * delta
    if (pp.y <= 0) { pp.y = 0; playerVelocityYRef.current = 0; playerGroundedRef.current = true }

    const op = opponentPosRef.current
    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(pp.x, pp.y || 0, pp.z)
      playerGroupRef.current.rotation.y = Math.atan2(op.x - pp.x, op.z - pp.z)
    }

    let pAnim = 'idle'
    if (!playerGroundedRef.current) pAnim = 'jump'
    else if (mv) pAnim = 'walk'
    setPlayerAnimState(pAnim)

    // Shield duration
    if (playerShieldRef.current > 0) playerShieldRef.current -= delta

    // Apply received opponent position to mesh
    if (opponentGroupRef.current) {
      opponentGroupRef.current.position.set(op.x, op.y || 0, op.z)
      opponentGroupRef.current.rotation.y = Math.atan2(pp.x - op.x, pp.z - op.z)
    }

    // Broadcast local position at ~15fps (every 8 frames) to avoid network buffer flooding
    frameCounterRef.current++
    if (frameCounterRef.current % 8 === 0) {
      sendData?.({ type: 'pos', x: pp.x, y: pp.y || 0, z: pp.z, anim: pAnim })
    }

    // Cooldown ticks
    const cd = cooldownsRef.current
    if (cd.q > 0) cd.q = Math.max(0, cd.q - delta)
    if (cd.e > 0) cd.e = Math.max(0, cd.e - delta)
    if (cd.r > 0) cd.r = Math.max(0, cd.r - delta)
    if (cd.f > 0) cd.f = Math.max(0, cd.f - delta)
    duelState.cooldowns = { ...cd }
  })

  return (
    <>
      <DuelCamera playerRef={playerPosRef} opponentRef={opponentPosRef} />
      <DuelLighting />
      <DuelArena />

      {/* Local player */}
      <group ref={playerGroupRef} position={[0, 0, myStartZ]}>
        <GameCharacter
          targetHeight={playerHeight}
          character={selectedCharacter}
          animState={playerAnimState}
          castTrigger={playerCastTrigger}
          wandElement={<DuelWand position={[wandPosX, wandPosY, wandPosZ]} rotation={[wandRotX, wandRotY, wandRotZ]} />}
        />
        {playerShieldRef.current > 0 && (
          <mesh position={[0, playerHeight / 2, -1]}>
            <cylinderGeometry args={[1.5, 1.5, playerHeight * 1.2, 32, 1, true, -Math.PI / 4, Math.PI / 2]} />
            <meshStandardMaterial
              color="#aaaaff" emissive="#3366ff" emissiveIntensity={2}
              transparent opacity={0.4} depthWrite={false} side={2} wireframe
            />
          </mesh>
        )}
      </group>

      {/* Remote opponent */}
      <group ref={opponentGroupRef} position={[0, 0, opStartZ]}>
        <GameCharacter
          targetHeight={opponentHeight}
          character={opponentCharacter}
          animState={opponentAnimState}
          castTrigger={opponentCastTrigger}
          wandElement={<DuelWand position={[wandPosX, wandPosY, wandPosZ]} rotation={[wandRotX, wandRotY, wandRotZ]} />}
        />
      </group>

      {/* Active spells */}
      {playerSpells.map(s => (
        <SpellProjectile key={s.id} {...s} playerRef={playerPosRef} opponentRef={opponentPosRef} onHit={handleHit} />
      ))}
      {opponentSpells.map(s => (
        <SpellProjectile key={s.id} {...s} playerRef={playerPosRef} opponentRef={opponentPosRef} onHit={handleHit} />
      ))}

      {/* Hit bursts */}
      {hitEffects.map(e => (
        <HitBurst key={e.id} {...e} onDone={removeEffect} />
      ))}

      {/* Voice status overlay */}
      {voiceStatus && (
        <group position={[playerPosRef.current.x, playerHeight + 0.8, playerPosRef.current.z]}>
        </group>
      )}

      <DuelEffects />
    </>
  )
}
