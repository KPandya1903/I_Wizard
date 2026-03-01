import { HALL, COLORS } from './hallConfig'

function LongTable({ x }) {
  const tableLength = HALL.length * 0.7

  return (
    <group position={[x, 1.2, 0]}>
      {/* Table top */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[6, 0.3, tableLength]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.85} />
      </mesh>
      {/* Legs — 6 pairs */}
      {Array.from({ length: 6 }, (_, li) => {
        const legZ = -tableLength / 2 + (li + 0.5) * (tableLength / 6)
        return [-2.5, 2.5].map((lx) => (
          <mesh key={`${li}-${lx}`} position={[lx, -0.9, legZ]} castShadow>
            <boxGeometry args={[0.3, 1.5, 0.3]} />
            <meshStandardMaterial color={COLORS.wood} roughness={0.85} />
          </mesh>
        ))
      })}
      {/* Benches */}
      {[-4.5, 4.5].map((bx) => (
        <mesh key={bx} position={[bx, -0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.15, tableLength - 4]} />
          <meshStandardMaterial color={COLORS.woodLight} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function HeadTable() {
  const pw = HALL.width - 8

  return (
    <group position={[0, 0, -(HALL.length / 2) + 8]}>
      {/* Raised platform */}
      <mesh position={[0, 0.75, 0]} receiveShadow castShadow>
        <boxGeometry args={[pw, 1.5, 10]} />
        <meshStandardMaterial color={COLORS.stone} roughness={0.85} />
      </mesh>
      {/* Step */}
      <mesh position={[0, 0.25, 6]} receiveShadow>
        <boxGeometry args={[pw + 4, 0.5, 3]} />
        <meshStandardMaterial color={COLORS.stoneFloor} roughness={0.9} />
      </mesh>
      {/* Table */}
      <mesh position={[0, 2.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[pw - 8, 0.3, 4]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.8} />
      </mesh>
    </group>
  )
}

export default function StoneTables() {
  return (
    <group>
      <LongTable x={-12.6} />
      <LongTable x={-4.2} />
      <LongTable x={4.2} />
      <LongTable x={12.6} />
      <HeadTable />
    </group>
  )
}
