import { useMemo } from 'react'
import * as THREE from 'three'
import { HALL } from './hallConfig'

function createCarpetTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Deep crimson base — plain
  ctx.fillStyle = '#6b0f1a'
  ctx.fillRect(0, 0, 512, 512)

  // Subtle fabric texture — very faint noise
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const r = 2 + Math.random() * 6
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(HALL.width / 6, HALL.length / 6)
  return tex
}

export default function Carpet() {
  const texture = useMemo(() => createCarpetTexture(), [])

  return (
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[HALL.width, HALL.length]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.95}
        metalness={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
