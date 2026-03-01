import { useMemo } from 'react'
import * as THREE from 'three'
import { HALL } from './hallConfig'

export default function EnchantedCeiling() {
  const { positions, sizes } = useMemo(() => {
    const count = 500
    const pos = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.4
      const r = 100 + Math.random() * 20
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = HALL.height + r * Math.cos(phi)
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      sz[i] = 0.3 + Math.random() * 0.7
    }
    return { positions: pos, sizes: sz }
  }, [])

  return (
    <group>
      {/* Sky dome */}
      <mesh position={[0, HALL.height, 0]}>
        <sphereGeometry args={[110, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#050520" side={THREE.BackSide} />
      </mesh>

      {/* Static stars — no per-frame updates */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={positions} count={500} itemSize={3} />
          <bufferAttribute attach="attributes-size" array={sizes} count={500} itemSize={1} />
        </bufferGeometry>
        <pointsMaterial size={0.6} color="#ffffff" sizeAttenuation transparent opacity={0.9} />
      </points>

      {/* Moon — blooms */}
      <mesh position={[30, HALL.height + 60, -40]}>
        <sphereGeometry args={[5, 16, 16]} />
        <meshBasicMaterial color="#ccddff" toneMapped={false} />
      </mesh>

      {/* Faint nebula glow */}
      <mesh position={[-20, HALL.height + 50, 20]}>
        <sphereGeometry args={[15, 12, 12]} />
        <meshBasicMaterial color="#220044" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}
