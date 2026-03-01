import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Trail } from '@react-three/drei'
import * as THREE from 'three'
import { useControls } from 'leva'
import DuelArena from './components/duel/DuelArena'
import DuelLighting from './components/duel/DuelLighting'
import DuelEffects from './components/duel/DuelEffects'
import CrowdAudio from './components/duel/CrowdAudio'
import DuelWand from './components/duel/DuelWand'
import GameCharacter from './components/GameCharacter'
import { CHARACTER_CONFIGS } from './data/characterConfigs'
import { duelState, LEVEL_CONFIGS } from './lib/duelStore'
import { stopSpeaking, speakAsOpponent } from './lib/speak'
import { handState } from './lib/handTracker'

// Voice spell matching — maps recognized words to spell keys (loose matching)
const VOICE_SPELL_MAP = [
  {
    key: 'r', patterns: [
      'avada', 'kedavra', 'cadaver', 'abra', 'kadabra', 'abracadabra',
      'avenger', 'arvada', 'arvard', 'kavada', 'cada', 'kedav', 'cadav',
      'avad', 'vodka', 'avocado', 'avatar', 'nevada', 'bada', 'dava',
    ]
  },
  {
    key: 'q', patterns: [
      'expel', 'armus', 'disarm', 'expelliarmus', 'expelli',
      'spell', 'expelling', 'expelled', 'expert', 'express',
      'explore', 'expo', 'explain', 'expat', 'expect',
      'excel', 'expanding', 'experiment',
    ]
  },
  {
    key: 'e', patterns: [
      'stupe', 'stupefy', 'stupid', 'stupify', 'stupi', 'stun',
      'stumpy', 'stuff', 'stooge', 'stop', 'stoop', 'stew',
      'super', 'snoopy', 'soupy', 'stuffy', 'spooky',
    ]
  },
  {
    key: 'f', patterns: [
      'protego', 'protect', 'shield', 'defense', 'guard', 'block',
      'potato', 'pro', 'tego'
    ]
  },
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

// Browser SpeechRecognition
const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

// ── Spell definitions ─────────────────────────────────────────────────────────
export const SPELL_DEFS = {
  e: { name: 'Stupefy', color: '#3399ff', lightColor: '#66bbff', damage: 25, cooldown: 1.0, speed: 22, size: 0.15 },
  r: { name: 'Avada Kedavra', color: '#00ee44', lightColor: '#44ff88', damage: 45, cooldown: 5.0, speed: 28, size: 0.22 },
  f: { name: 'Protego', color: '#aaaaff', lightColor: '#ccddff', isShield: true, duration: 3.0, cooldown: 8.0 },
}

const ARENA_RADIUS = 18
const WALK_SPEED = 5
const AI_SPEED = 6
const HAND_Y = 1.05
const CAM_HEIGHT = 2.5
const CAM_DIST = 3.5 // close third-person
const AI_JUMP_VEL = 10
const AI_GRAVITY = -25

// Gesture → spell mapping
const GESTURE_SPELL = { fist: 'f', open: 'e', peace: 'r' }

// Module-level key state for duel movement
const duelKeys = {}

// ── Camera: close third-person behind player ──────────────────────────────────
function DuelCamera({ playerRef, opponentRef }) {
  const { camera } = useThree()

  useFrame(() => {
    const pp = playerRef.current
    const op = opponentRef.current

    // Angle from player toward opponent
    const angle = Math.atan2(op.x - pp.x, op.z - pp.z)

    // Position camera behind & above the player
    const camX = pp.x - Math.sin(angle) * CAM_DIST
    const camZ = pp.z - Math.cos(angle) * CAM_DIST
    const camY = (pp.y || 0) + CAM_HEIGHT

    camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.1)

    // Look at a point between the player and opponent
    const lookX = (pp.x + op.x) / 2
    const lookZ = (pp.z + op.z) / 2
    camera.lookAt(new THREE.Vector3(lookX, 1.0, lookZ))
  })
  return null
}

// ── Spell projectile with trail ───────────────────────────────────────────────
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

// ── Expanding burst ring on hit ───────────────────────────────────────────────
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

// ── Main scene ────────────────────────────────────────────────────────────────
export default function DuelScene({ selectedCharacter, opponent }) {
  const playerHeight = CHARACTER_CONFIGS[selectedCharacter]?.height || 1.8
  const levelConfigRef = useRef(LEVEL_CONFIGS[duelState.currentLevel] || LEVEL_CONFIGS[1])
  const levelConfig = levelConfigRef.current

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
  const playerPosRef = useRef(new THREE.Vector3(0, 0, 8))
  const opponentPosRef = useRef(new THREE.Vector3(0, 0, -8))
  const opponentTargetRef = useRef(new THREE.Vector3(0, 0, -8))
  const targetTimerRef = useRef(2)
  const aiCooldownRef = useRef(levelConfig.aiAttackMin + Math.random() * (levelConfig.aiAttackMax - levelConfig.aiAttackMin))
  const tauntTimerRef = useRef(5 + Math.random() * 5)
  const aiJumpTimerRef = useRef(3 + Math.random() * 4)
  const aiVelocityYRef = useRef(0)
  const aiGroundedRef = useRef(true)
  const playerVelocityYRef = useRef(0)
  const playerGroundedRef = useRef(true)
  const cooldownsRef = useRef({ q: 0, e: 0, r: 0, f: 0 })
  const playerHPRef = useRef(100)
  const opponentHPRef = useRef(100)
  const gameResultRef = useRef(null)
  const playerShieldRef = useRef(0)
  const winTimerRef = useRef(0)

  const [playerAnimState, setPlayerAnimState] = useState('idle')
  const [opponentAnimState, setOpponentAnimState] = useState('idle')
  const [playerSpells, setPlayerSpells] = useState([])
  const [opponentSpells, setOpponentSpells] = useState([])
  const [hitEffects, setHitEffects] = useState([])
  const [playerCastTrigger, setPlayerCastTrigger] = useState(0)
  const [opponentCastTrigger, setOpponentCastTrigger] = useState(0)

  // Reset on mount — also stop any ongoing NPC speech
  useEffect(() => {
    stopSpeaking()
    const lc = levelConfigRef.current
    duelState.playerHP = 100
    duelState.opponentHP = lc.opponentMaxHP
    duelState.opponentMaxHP = lc.opponentMaxHP
    duelState.gameResult = null
    duelState.cooldowns = { q: 0, e: 0, r: 0, f: 0 }
    playerHPRef.current = 100
    opponentHPRef.current = lc.opponentMaxHP
    gameResultRef.current = null
    playerShieldRef.current = 0

    // Greet the player with a taunt at the start
    const greeting = lc.taunts[Math.floor(Math.random() * lc.taunts.length)]
    setTimeout(() => speakAsOpponent(greeting), 1500)

    return () => {
      duelState.playerHP = 100
      duelState.opponentHP = 100
      duelState.gameResult = null
    }
  }, [])

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

  // Cast spells — always auto-aim at opponent
  const castPlayerSpell = useCallback((key) => {
    if (gameResultRef.current || cooldownsRef.current[key] > 0) return
    const def = SPELL_DEFS[key]
    cooldownsRef.current[key] = def.cooldown

    const pp = playerPosRef.current
    const op = opponentPosRef.current
    const origin = [pp.x + 0.3, HAND_Y, pp.z]
    const dir = new THREE.Vector3(op.x - origin[0], 0, op.z - origin[2]).normalize().toArray()

    setPlayerCastTrigger(Date.now())

    if (def.isShield) {
      playerShieldRef.current = def.duration
    } else {
      setPlayerSpells(prev => [...prev, { id: Date.now(), origin, dirArr: dir, caster: 'player', ...def }])
    }
  }, [])

  const castOpponentSpell = useCallback(() => {
    const keys = ['e', 'r']
    const key = keys[Math.floor(Math.random() * keys.length)]
    const def = SPELL_DEFS[key]
    if (!def) return
    const op = opponentPosRef.current
    const pp = playerPosRef.current
    const origin = [op.x - 0.3, HAND_Y, op.z]
    const dir = new THREE.Vector3(pp.x - origin[0], 0, pp.z - origin[2]).normalize().toArray()

    speakAsOpponent(def.name + '!') // fire-and-forget
    setOpponentCastTrigger(Date.now())
    setOpponentSpells(prev => [...prev, { id: Date.now() + Math.random(), origin, dirArr: dir, caster: 'opponent', ...def }])
  }, [])

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

  // ── Gesture-based spell casting ──
  const lastGestureRef = useRef(null)
  const gestureCooldownRef = useRef(0)

  useEffect(() => {
    let frameId
    function checkGesture() {
      if (handState.active && handState.gesture) {
        const gesture = handState.gesture
        const spellKey = GESTURE_SPELL[gesture]

        if (gesture === 'fist') {
          // Continuous shield
          if (cooldownsRef.current.f <= 0) {
            playerShieldRef.current = 0.5 // Keep a small buffer so it stays active
            // We can manually trigger the recoil here occasionally if we want,
            // but for a continuous shield, it's fine to just hold it.
            if (lastGestureRef.current !== 'fist') {
              setPlayerCastTrigger(Date.now()) // initial flick
            }
          }
        } else if (spellKey && gesture !== lastGestureRef.current && Date.now() > gestureCooldownRef.current) {
          // Regular attack spells
          castPlayerSpell(spellKey)
          gestureCooldownRef.current = Date.now() + 1000
        }
        lastGestureRef.current = gesture
      } else {
        // If fist is released, start cooldown
        if (lastGestureRef.current === 'fist') {
          cooldownsRef.current.f = SPELL_DEFS.f.cooldown
        }
        lastGestureRef.current = null
      }
      frameId = requestAnimationFrame(checkGesture)
    }
    checkGesture()
    return () => cancelAnimationFrame(frameId)
  }, [castPlayerSpell])

  // ── Voice spell casting (push-to-talk: press V) ──
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
        const spellKey = (matched && SPELL_DEFS[matched]) ? matched : spellKeys[Math.floor(Math.random() * spellKeys.length)]
        setVoiceStatus(`🪄 ${SPELL_DEFS[spellKey].name}!`)
        castPlayerSpell(spellKey)
        setTimeout(() => setVoiceStatus(null), 1200)
      }

      recognizer.onerror = () => setVoiceStatus(null)
      recognizer.onend = () => {
        voiceActiveRef.current = false
        recognizer = null
      }

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
        opponentHPRef.current = Math.max(0, opponentHPRef.current - damage)
        duelState.opponentHP = opponentHPRef.current
        if (opponentHPRef.current <= 0) {
          setOpponentAnimState('dying')
          winTimerRef.current = 3.0 // Wait 3 seconds for death anim
          gameResultRef.current = 'win' // Mark win but don't show UI yet
        }
      }
    } else {
      setOpponentSpells(prev => prev.filter(s => s.id !== id))
      if (isHit && !gameResultRef.current && winTimerRef.current <= 0) {
        if (playerShieldRef.current > 0) {
          // Shield absorbs the hit! No damage taken
        } else {
          const scaledDamage = damage * levelConfigRef.current.incomingDamageMult
          playerHPRef.current = Math.max(0, playerHPRef.current - scaledDamage)
          duelState.playerHP = playerHPRef.current
          if (playerHPRef.current <= 0) {
            setPlayerAnimState('dying')
            winTimerRef.current = 3.0 // Wait 3 seconds for death anim
            gameResultRef.current = 'lose' // Mark lose but don't show UI yet
          }
        }
      }
    }
    if (isHit) {
      setHitEffects(prev => [...prev, { id: Date.now() + Math.random(), position: hitPos, color }])
    }
  }, [])

  const removeEffect = useCallback(id => setHitEffects(prev => prev.filter(e => e.id !== id)), [])

  // Per-frame update
  useFrame((_, delta) => {
    // ── Handle Match End Delay ──
    if (winTimerRef.current > 0) {
      winTimerRef.current -= delta
      if (winTimerRef.current <= 0 && gameResultRef.current) {
        // Now trigger the actual end game UI overlay
        duelState.gameResult = gameResultRef.current
      }
      return // Stop playing the active game once someone dies
    }

    if (gameResultRef.current && duelState.gameResult) return

    // ── Player movement ──
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
      playerVelocityYRef.current = AI_JUMP_VEL
      playerGroundedRef.current = false
    }
    playerVelocityYRef.current += AI_GRAVITY * delta
    pp.y = (pp.y || 0) + playerVelocityYRef.current * delta
    if (pp.y <= 0) {
      pp.y = 0
      playerVelocityYRef.current = 0
      playerGroundedRef.current = true
    }

    // Face opponent
    const op = opponentPosRef.current
    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(pp.x, pp.y || 0, pp.z)
      playerGroupRef.current.rotation.y = Math.atan2(op.x - pp.x, op.z - pp.z)
    }
    let pAnim = 'idle'
    if (!playerGroundedRef.current) pAnim = 'jump'
    else if (mv) pAnim = 'walk'
    setPlayerAnimState(pAnim)

    // ── Shield Duration ──
    if (playerShieldRef.current > 0) {
      playerShieldRef.current -= delta
    }

    // ── AI movement ──
    targetTimerRef.current -= delta
    if (targetTimerRef.current <= 0) {
      targetTimerRef.current = 1 + Math.random() * 2
      // Mix between strafing around player and random positions
      if (Math.random() < 0.4) {
        // Strafe: pick a point roughly same distance from player but at an angle
        const angle = Math.atan2(op.z - pp.z, op.x - pp.x) + (Math.random() - 0.5) * 2
        const dist = 6 + Math.random() * 6
        opponentTargetRef.current.set(
          pp.x + Math.cos(angle) * dist,
          0,
          pp.z + Math.sin(angle) * dist
        )
      } else {
        opponentTargetRef.current.set(
          (Math.random() - 0.5) * 24,
          0,
          (Math.random() - 0.5) * 24
        )
      }
    }
    const ot = opponentTargetRef.current
    const adx = ot.x - op.x; const adz = ot.z - op.z
    const ad = Math.sqrt(adx * adx + adz * adz)
    const aiMoving = ad > 0.3
    if (aiMoving) { op.x += (adx / ad) * levelConfigRef.current.aiSpeed * delta; op.z += (adz / ad) * levelConfigRef.current.aiSpeed * delta }
    const ar = Math.sqrt(op.x * op.x + op.z * op.z)
    if (ar > ARENA_RADIUS) { op.x *= ARENA_RADIUS / ar; op.z *= ARENA_RADIUS / ar }

    // ── AI jump ──
    aiJumpTimerRef.current -= delta
    if (aiJumpTimerRef.current <= 0 && aiGroundedRef.current) {
      aiJumpTimerRef.current = 2 + Math.random() * 4
      aiVelocityYRef.current = AI_JUMP_VEL
      aiGroundedRef.current = false
    }
    aiVelocityYRef.current += AI_GRAVITY * delta
    op.y = (op.y || 0) + aiVelocityYRef.current * delta
    if (op.y <= 0) {
      op.y = 0
      aiVelocityYRef.current = 0
      aiGroundedRef.current = true
    }

    if (opponentGroupRef.current) {
      opponentGroupRef.current.position.set(op.x, op.y || 0, op.z)
      opponentGroupRef.current.rotation.y = Math.atan2(pp.x - op.x, pp.z - op.z)
    }

    // Opponent animation state
    let aiAnim = 'idle'
    if (!aiGroundedRef.current) aiAnim = 'jump'
    else if (aiMoving) aiAnim = 'walk'
    setOpponentAnimState(aiAnim)

    // ── AI attack ──
    aiCooldownRef.current -= delta
    if (aiCooldownRef.current <= 0 && !gameResultRef.current) {
      const lc = levelConfigRef.current
      aiCooldownRef.current = lc.aiAttackMin + Math.random() * (lc.aiAttackMax - lc.aiAttackMin)
      castOpponentSpell()
    }

    // ── Taunt timer ──
    tauntTimerRef.current -= delta
    if (tauntTimerRef.current <= 0 && !gameResultRef.current) {
      tauntTimerRef.current = 12 + Math.random() * 8
      const taunts = levelConfigRef.current.taunts
      speakAsOpponent(taunts[Math.floor(Math.random() * taunts.length)])
    }

    // ── Cooldowns → store ──
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


      {/* Player character — visible in third-person */}
      <group ref={playerGroupRef} position={[0, 0, 8]}>
        <GameCharacter
          targetHeight={playerHeight}
          character={selectedCharacter}
          animState={playerAnimState}
          castTrigger={playerCastTrigger}
          wandElement={<DuelWand position={[wandPosX, wandPosY, wandPosZ]} rotation={[wandRotX, wandRotY, wandRotZ]} />}
        />
        {playerShieldRef.current > 0 && (
          <mesh position={[0, playerHeight / 2, -1]} rotation={[0, 0, 0]}>
            {/* Open cylinder makes a curved wall. radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength */}
            <cylinderGeometry args={[1.5, 1.5, playerHeight * 1.2, 32, 1, true, -Math.PI / 4, Math.PI / 2]} />
            <meshStandardMaterial
              color="#aaaaff"
              emissive="#3366ff"
              emissiveIntensity={2}
              transparent
              opacity={0.4}
              depthWrite={false}
              side={THREE.DoubleSide}
              wireframe={true} // Gives it a "magnetic grid" look
            />
          </mesh>
        )}
      </group>

      {/* Opponent character */}
      <group ref={opponentGroupRef} position={[0, 0, -8]}>
        <GameCharacter
          targetHeight={(CHARACTER_CONFIGS[opponent]?.height || 1.8) * levelConfig.heightScale}
          character={opponent}
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

      <DuelEffects />
    </>
  )
}
