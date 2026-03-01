import { useMemo } from 'react'
import * as THREE from 'three'
import { HALL, COLORS } from './hallConfig'

function ColumnCluster({ position }) {
  const r = 0.6
  const h = HALL.height

  return (
    <group position={position}>
      {/* Main column */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[r, r * 1.15, h, 12]} />
        <meshStandardMaterial color={COLORS.stone} roughness={0.75} metalness={0.05} />
      </mesh>
      {/* Flanking thin columns */}
      {[0.5, -0.5].map((offset, j) => (
        <mesh key={j} position={[offset, 0, 0]} castShadow>
          <cylinderGeometry args={[r * 0.3, r * 0.35, h, 8]} />
          <meshStandardMaterial color={COLORS.stone} roughness={0.75} />
        </mesh>
      ))}
      {/* Base plinth */}
      <mesh position={[0, -h / 2, 0]} receiveShadow>
        <cylinderGeometry args={[r * 2, r * 1.8, 0.8, 12]} />
        <meshStandardMaterial color={COLORS.stoneDark} roughness={0.85} />
      </mesh>
      {/* Capital */}
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[r * 2.5, r * 1.2, 1.2, 12]} />
        <meshStandardMaterial color={COLORS.stone} roughness={0.7} />
      </mesh>
    </group>
  )
}

function PointedArch({ z }) {
  const halfW = HALL.width / 2 - 4
  const topY = HALL.height - 1
  const baseY = HALL.height
  const beamLen = Math.sqrt(halfW * halfW + 4)
  const angle = Math.atan2(topY - baseY + 4, halfW)

  return (
    <group position={[0, 0, z]}>
      {/* Left arch beam */}
      <mesh position={[-halfW / 2, topY - 1, 0]} rotation={[0, 0, angle + 0.05]}>
        <boxGeometry args={[beamLen, 0.6, 0.6]} />
        <meshStandardMaterial color={COLORS.stoneDark} roughness={0.8} />
      </mesh>
      {/* Right arch beam */}
      <mesh position={[halfW / 2, topY - 1, 0]} rotation={[0, 0, -(angle + 0.05)]}>
        <boxGeometry args={[beamLen, 0.6, 0.6]} />
        <meshStandardMaterial color={COLORS.stoneDark} roughness={0.8} />
      </mesh>
    </group>
  )
}

export default function GothicColumns() {
  const positions = useMemo(() => {
    const items = []
    const spacing = HALL.length / (HALL.columnCount + 1)
    for (let i = 1; i <= HALL.columnCount; i++) {
      const z = -HALL.length / 2 + i * spacing
      items.push({ z, lx: -(HALL.width / 2) + 4, rx: (HALL.width / 2) - 4 })
    }
    return items
  }, [])

  return (
    <group>
      {positions.map((col, i) => (
        <group key={i}>
          <ColumnCluster position={[col.lx, HALL.height / 2, col.z]} />
          <ColumnCluster position={[col.rx, HALL.height / 2, col.z]} />
          <PointedArch z={col.z} />
        </group>
      ))}

      {/* Central ridge beam — runs full hall length */}
      <mesh position={[0, HALL.height - 0.5, 0]}>
        <boxGeometry args={[0.8, 0.8, HALL.length]} />
        <meshStandardMaterial color={COLORS.stoneDark} roughness={0.8} />
      </mesh>
    </group>
  )
}
