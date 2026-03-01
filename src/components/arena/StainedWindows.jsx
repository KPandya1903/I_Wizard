import { useMemo } from 'react'
import * as THREE from 'three'
import { HALL, COLORS } from './hallConfig'

const windowColors = [
  { color: '#4466aa', emissive: '#223366' },
  { color: '#aa3344', emissive: '#662233' },
  { color: '#44aa66', emissive: '#226644' },
  { color: '#aa8833', emissive: '#664422' },
]

function StainedWindow({ position, rotation, colorSet }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Stone frame */}
      <mesh>
        <boxGeometry args={[5.5, 13, 0.8]} />
        <meshStandardMaterial color={COLORS.stoneDark} roughness={0.9} />
      </mesh>
      {/* Glass pane */}
      <mesh position={[0, 0, 0.2]}>
        <planeGeometry args={[4, 11]} />
        <meshStandardMaterial
          color={colorSet.color}
          transparent
          opacity={0.35}
          emissive={colorSet.emissive}
          emissiveIntensity={0.8}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      {/* Pointed arch top */}
      <mesh position={[0, 7, 0.2]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[2.2, 3, 3]} />
        <meshStandardMaterial
          color={colorSet.color}
          transparent
          opacity={0.3}
          emissive={colorSet.emissive}
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

export default function StainedWindows() {
  const windows = useMemo(() => {
    const items = []
    const spacing = HALL.length / (HALL.windowCount + 1)
    for (let i = 1; i <= HALL.windowCount; i++) {
      const z = -HALL.length / 2 + i * spacing
      const cs = windowColors[i % windowColors.length]
      items.push({ pos: [-(HALL.width / 2) + 0.3, HALL.height * 0.55, z], rot: [0, Math.PI / 2, 0], cs })
      items.push({ pos: [(HALL.width / 2) - 0.3, HALL.height * 0.55, z], rot: [0, -Math.PI / 2, 0], cs })
    }
    return items
  }, [])

  return (
    <>
      {windows.map((w, i) => (
        <StainedWindow key={i} position={w.pos} rotation={w.rot} colorSet={w.cs} />
      ))}
    </>
  )
}
