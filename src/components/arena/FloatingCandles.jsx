import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HALL } from './hallConfig'

export default function FloatingCandles({ count = 200 }) {
  const candleRef = useRef()
  const flameRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const candleData = useMemo(() => {
    const data = []
    for (let i = 0; i < count; i++) {
      data.push({
        x: (Math.random() - 0.5) * (HALL.width - 10),
        baseY: 15 + Math.random() * 15,
        // Keep candles away from both end walls — stops bloom washing over the banners
        z: (Math.random() - 0.5) * (HALL.length - 24),
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.4,
        floatAmp: 0.3 + Math.random() * 0.5,
        scale: 0.7 + Math.random() * 0.6,
      })
    }
    return data
  }, [count])

  useFrame((state) => {
    if (!candleRef.current || !flameRef.current) return
    const t = state.clock.elapsedTime
    candleData.forEach((c, i) => {
      const y = c.baseY + Math.sin(t * c.speed + c.phase) * c.floatAmp

      dummy.position.set(c.x, y, c.z)
      dummy.scale.set(c.scale, c.scale, c.scale)
      dummy.updateMatrix()
      candleRef.current.setMatrixAt(i, dummy.matrix)

      dummy.position.set(c.x, y + 0.7 * c.scale, c.z)
      dummy.scale.set(c.scale * 0.5, c.scale * 0.7, c.scale * 0.5)
      dummy.updateMatrix()
      flameRef.current.setMatrixAt(i, dummy.matrix)
    })
    candleRef.current.instanceMatrix.needsUpdate = true
    flameRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      {/* Candle bodies */}
      <instancedMesh ref={candleRef} args={[null, null, count]}>
        <cylinderGeometry args={[0.12, 0.15, 1.2, 6]} />
        <meshStandardMaterial color="#f5e6c8" roughness={0.8} />
      </instancedMesh>

      {/* Flames — bloom target */}
      <instancedMesh ref={flameRef} args={[null, null, count]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial
          color="#ff8800"
          emissive="#ffaa44"
          emissiveIntensity={4}
          toneMapped={false}
        />
      </instancedMesh>
    </>
  )
}
