import { Environment } from '@react-three/drei'

export default function DuelLighting() {
  return (
    <>
      <ambientLight intensity={0.8} color="#aaaacc" />
      <Environment preset="night" background={false} />

      {/* Dramatic overhead spotlight on arena center */}
      <spotLight
        position={[0, 30, 0]}
        angle={0.6}
        penumbra={0.8}
        intensity={1200}
        color="#ffe8cc"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Blue rim light — left side */}
      <pointLight position={[20, 15, 0]} intensity={400} color="#4488ff" />

      {/* Red rim light — right side */}
      <pointLight position={[-20, 15, 0]} intensity={400} color="#ff4444" />

      {/* Warm fill from behind camera */}
      <pointLight position={[0, 10, 25]} intensity={200} color="#ffddaa" />
    </>
  )
}
