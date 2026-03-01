import { HALL, COLORS } from './hallConfig'

export default function GrandEntrance() {
  const archZ = HALL.length / 2
  const archWidth = 12
  const archHeight = 20
  const hw = HALL.width / 2
  const hh = HALL.height / 2

  return (
    <group position={[0, 0, archZ]}>
      {/* Left wall section */}
      <mesh position={[-(hw / 2 + archWidth / 4), hh, 0]} receiveShadow>
        <boxGeometry args={[hw - archWidth / 2, HALL.height, HALL.wallThickness]} />
        <meshStandardMaterial color={COLORS.stoneWall} roughness={0.9} />
      </mesh>
      {/* Right wall section */}
      <mesh position={[(hw / 2 + archWidth / 4), hh, 0]} receiveShadow>
        <boxGeometry args={[hw - archWidth / 2, HALL.height, HALL.wallThickness]} />
        <meshStandardMaterial color={COLORS.stoneWall} roughness={0.9} />
      </mesh>
      {/* Above arch */}
      <mesh position={[0, HALL.height - (HALL.height - archHeight) / 2, 0]}>
        <boxGeometry args={[archWidth + 2, HALL.height - archHeight, HALL.wallThickness]} />
        <meshStandardMaterial color={COLORS.stoneWall} roughness={0.9} />
      </mesh>

      {/* Arch pillars */}
      <mesh position={[-archWidth / 2 - 0.5, archHeight / 2, 0.5]} castShadow>
        <boxGeometry args={[1.5, archHeight, 1.5]} />
        <meshStandardMaterial color={COLORS.stoneDark} roughness={0.8} />
      </mesh>
      <mesh position={[archWidth / 2 + 0.5, archHeight / 2, 0.5]} castShadow>
        <boxGeometry args={[1.5, archHeight, 1.5]} />
        <meshStandardMaterial color={COLORS.stoneDark} roughness={0.8} />
      </mesh>

      {/* Keystone */}
      <mesh position={[0, archHeight + 1, 0.5]}>
        <boxGeometry args={[2, 2, 1.5]} />
        <meshStandardMaterial color={COLORS.stoneDark} roughness={0.75} />
      </mesh>
    </group>
  )
}
