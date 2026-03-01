import { useMemo } from 'react'
import * as THREE from 'three'
import { HALL, COLORS } from './hallConfig'

function createFloorTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Base stone color
  ctx.fillStyle = '#4a4038'
  ctx.fillRect(0, 0, 512, 512)

  // Subtle stone variation — random soft patches
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const r = 10 + Math.random() * 30
    const brightness = Math.random() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'
    ctx.fillStyle = brightness
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Faint grid lines for stone slabs (subtle, not raised)
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 1
  const slabSize = 64
  for (let x = 0; x <= 512; x += slabSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 512)
    ctx.stroke()
  }
  for (let y = 0; y <= 512; y += slabSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(512, y)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(HALL.width / 8, HALL.length / 8)
  return tex
}

export default function StoneFloor() {
  const texture = useMemo(() => createFloorTexture(), [])

  return (
    <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[HALL.width, HALL.length]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.9}
        metalness={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
