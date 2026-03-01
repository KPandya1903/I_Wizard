import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useControls } from 'leva'

export default function Effects() {
  const { bloomIntensity, bloomThreshold } = useControls('Effects', {
    bloomIntensity: { value: 0.8, min: 0, max: 5, step: 0.1 },
    bloomThreshold: { value: 0.9, min: 0, max: 2, step: 0.05 },
  })

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={0.3}
        intensity={bloomIntensity}
        levels={2}
        mipmapBlur
      />
    </EffectComposer>
  )
}
