import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

const owlPositions = [
  { pos: [-18.9, 22.4, 56], rot: 0.3 },
  { pos: [18.9, 22.4, 56], rot: -0.3 },
  { pos: [-19.6, 21, -63], rot: 0.8 },
  { pos: [19.6, 21, -63], rot: -0.8 },
  { pos: [-18.9, 22.4, 0], rot: 0.5 },
  { pos: [18.9, 22.4, 0], rot: -0.5 },
]

function Owl({ position, baseRotation = 0 }) {
  const headRef = useRef()
  const bodyRef = useRef()
  const timeOffset = useMemo(() => Math.random() * 100, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime + timeOffset
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.4) * 0.6
      headRef.current.rotation.z = Math.sin(t * 0.25) * 0.05
    }
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(t * 0.6) * 0.03
    }
  })

  return (
    <group position={position} rotation={[0, baseRotation, 0]}>
      <group ref={bodyRef}>
        {/* Body */}
        <mesh>
          <sphereGeometry args={[0.4, 12, 10]} />
          <meshStandardMaterial color="#5a4530" roughness={0.9} />
        </mesh>
        {/* Belly */}
        <mesh position={[0, -0.05, 0.15]}>
          <sphereGeometry args={[0.28, 10, 8]} />
          <meshStandardMaterial color="#8a7560" roughness={0.95} />
        </mesh>

        {/* Head */}
        <group ref={headRef} position={[0, 0.45, 0.05]}>
          <mesh>
            <sphereGeometry args={[0.25, 10, 8]} />
            <meshStandardMaterial color="#6a5540" roughness={0.9} />
          </mesh>
          {/* Beak */}
          <mesh position={[0, -0.05, 0.22]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.05, 0.12, 6]} />
            <meshStandardMaterial color="#cc9933" roughness={0.7} />
          </mesh>
          {/* Left eye */}
          <mesh position={[-0.1, 0.05, 0.2]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial
              color="#ffcc00"
              emissive="#ffaa00"
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>
          {/* Right eye */}
          <mesh position={[0.1, 0.05, 0.2]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial
              color="#ffcc00"
              emissive="#ffaa00"
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>
          {/* Ear tufts */}
          <mesh position={[-0.15, 0.2, 0]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.06, 0.15, 4]} />
            <meshStandardMaterial color="#5a4530" roughness={0.9} />
          </mesh>
          <mesh position={[0.15, 0.2, 0]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.06, 0.15, 4]} />
            <meshStandardMaterial color="#5a4530" roughness={0.9} />
          </mesh>
        </group>

        {/* Left wing */}
        <mesh position={[-0.35, 0.05, -0.05]} rotation={[0.1, 0, 0.4]}>
          <boxGeometry args={[0.3, 0.5, 0.08]} />
          <meshStandardMaterial color="#4a3a28" roughness={0.95} />
        </mesh>
        {/* Right wing */}
        <mesh position={[0.35, 0.05, -0.05]} rotation={[0.1, 0, -0.4]}>
          <boxGeometry args={[0.3, 0.5, 0.08]} />
          <meshStandardMaterial color="#4a3a28" roughness={0.95} />
        </mesh>

        {/* Feet */}
        <mesh position={[-0.1, -0.4, 0.1]}>
          <boxGeometry args={[0.08, 0.1, 0.15]} />
          <meshStandardMaterial color="#cc9933" roughness={0.7} />
        </mesh>
        <mesh position={[0.1, -0.4, 0.1]}>
          <boxGeometry args={[0.08, 0.1, 0.15]} />
          <meshStandardMaterial color="#cc9933" roughness={0.7} />
        </mesh>
      </group>
    </group>
  )
}

export default function Owls() {
  return (
    <>
      {owlPositions.map((owl, i) => (
        <Owl key={i} position={owl.pos} baseRotation={owl.rot} />
      ))}
    </>
  )
}
