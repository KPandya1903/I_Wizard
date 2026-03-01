import { Environment } from '@react-three/drei'
import { useControls } from 'leva'

export default function Lighting() {
  const { ambientIntensity, spotIntensity, envPreset } = useControls('Lighting', {
    ambientIntensity: { value: 1.2, min: 0, max: 3, step: 0.05 },
    spotIntensity: { value: 900, min: 0, max: 1500, step: 25 },
    envPreset: {
      options: ['lobby', 'sunset', 'warehouse', 'city', 'dawn', 'forest', 'night'],
      value: 'lobby',
    },
  })

  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#8888aa" />

      <Environment preset={envPreset} background={false} />

      {/* Main overhead — bright warm wash */}
      <spotLight
        position={[0, 26.6, 0]}
        angle={0.8}
        penumbra={0.9}
        intensity={spotIntensity}
        color="#ffe8cc"
        castShadow
        shadow-mapSize={[256, 256]}
        shadow-bias={-0.0001}
        target-position={[0, 0, 0]}
      />

      {/* Head table end — cool blue accent (no shadow for perf) */}
      <spotLight
        position={[0, 24.5, -63]}
        angle={0.6}
        penumbra={0.7}
        intensity={spotIntensity * 0.4}
        color="#4488ff"
        target-position={[0, 0, -35]}
      />

      {/* Entrance end fill */}
      <pointLight position={[0, 21, 63]} intensity={300} color="#ffddaa" />
    </>
  )
}
