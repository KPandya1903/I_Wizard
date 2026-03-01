import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

export default function DuelEffects() {
  return (
    <EffectComposer>
      <Bloom mipmapBlur luminanceThreshold={0.7} intensity={2.5} levels={6} />
      <Vignette offset={0.3} darkness={0.9} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
