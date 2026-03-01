import { useMemo } from 'react'
import * as THREE from 'three'

const ARENA_RADIUS = 25
const WALL_HEIGHT = 8
const TIER_COUNT = 3

function createSandTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Base sand color
  ctx.fillStyle = '#c2a86b'
  ctx.fillRect(0, 0, 512, 512)

  // Sand grain noise
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    ctx.fillStyle = Math.random() > 0.5
      ? `rgba(255,255,255,${0.03 + Math.random() * 0.05})`
      : `rgba(0,0,0,${0.03 + Math.random() * 0.06})`
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2)
  }

  // Subtle concentric ring marks
  ctx.strokeStyle = 'rgba(0,0,0,0.04)'
  ctx.lineWidth = 1
  for (let r = 40; r < 256; r += 35) {
    ctx.beginPath()
    ctx.arc(256, 256, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 3)
  return tex
}

function createWallTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  // Stone base
  ctx.fillStyle = '#5a5248'
  ctx.fillRect(0, 0, 256, 256)

  // Stone block lines
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 2
  for (let y = 0; y < 256; y += 32) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(256, y)
    ctx.stroke()
    const offset = (Math.floor(y / 32) % 2) * 64
    for (let x = offset; x < 256; x += 128) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + 32)
      ctx.stroke()
    }
  }

  // Noise
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(8, 2)
  return tex
}

export default function DuelArena() {
  const sandTex = useMemo(createSandTexture, [])
  const wallTex = useMemo(createWallTexture, [])

  return (
    <group>
      {/* Sand floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[ARENA_RADIUS, 64]} />
        <meshStandardMaterial map={sandTex} roughness={0.95} color="#d4b878" />
      </mesh>

      {/* Arena walls — open top cylinder, viewed from inside */}
      <mesh position={[0, WALL_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[ARENA_RADIUS + 1, ARENA_RADIUS + 1, WALL_HEIGHT, 64, 1, true]} />
        <meshStandardMaterial map={wallTex} roughness={0.9} side={THREE.BackSide} color="#6b6358" />
      </mesh>

      {/* Seating tiers */}
      {Array.from({ length: TIER_COUNT }).map((_, tier) => {
        const y = WALL_HEIGHT + tier * 2.5 + 1
        const radius = ARENA_RADIUS + 2 + tier * 3
        return (
          <group key={tier}>
            {/* Tier surface */}
            <mesh position={[0, y, 0]}>
              <torusGeometry args={[radius, 1.5, 8, 64]} />
              <meshStandardMaterial
                color={tier === 0 ? '#4a4038' : tier === 1 ? '#3d3530' : '#332d28'}
                roughness={0.85}
              />
            </mesh>
            {/* Tier back wall */}
            <mesh position={[0, y + 1.2, 0]}>
              <cylinderGeometry args={[radius + 1.5, radius + 1.5, 0.8, 64, 1, true]} />
              <meshStandardMaterial color="#3a3228" roughness={0.9} side={THREE.BackSide} />
            </mesh>
          </group>
        )
      })}

      {/* Sky dome */}
      <mesh>
        <sphereGeometry args={[80, 32, 16]} />
        <meshBasicMaterial color="#0a0a1e" side={THREE.BackSide} />
      </mesh>
    </group>
  )
}
