import { useMemo } from 'react'
import { HALL } from './hallConfig'

function Torch({ position }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshStandardMaterial color="#1a1008" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 1.0, 8]} />
        <meshStandardMaterial color="#1a1008" />
      </mesh>
      {/* Emissive flame — blooms via postprocessing, no real light needed */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial
          color="#ff4400"
          emissive="#ff6622"
          emissiveIntensity={5}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

export default function WallTorches() {
  const torches = useMemo(() => {
    const items = []
    const spacing = HALL.length / (HALL.torchCount + 1)
    for (let i = 1; i <= HALL.torchCount; i++) {
      const z = -HALL.length / 2 + i * spacing
      items.push([-(HALL.width / 2) + 2.5, HALL.height * 0.35, z])
      items.push([(HALL.width / 2) - 2.5, HALL.height * 0.35, z])
    }
    return items
  }, [])

  return (
    <>
      {torches.map((pos, i) => (
        <Torch key={i} position={pos} />
      ))}
    </>
  )
}
