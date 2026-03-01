import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { CHARACTER_CONFIGS } from '../../data/characterConfigs'

export default function DuelNPC({ character, position = [0, 0, -8], facingAngle = Math.PI }) {
  const config = CHARACTER_CONFIGS[character]
  const groupRef = useRef()
  const [model, setModel] = useState(null)
  const mixerRef = useRef(null)

  useEffect(() => {
    if (!config?.modelPath) return
    let disposed = false
    const loader = new FBXLoader()

    loader.load(
      config.modelPath,
      (fbx) => {
        if (disposed) return
        fbx.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        if (fbx.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(fbx)
          const action = mixer.clipAction(fbx.animations[0])
          action.play()
          mixerRef.current = mixer
        }
        setModel(fbx)
      },
      undefined,
      (err) => console.warn(`[DuelNPC] Failed to load ${character}:`, err.message)
    )

    return () => {
      disposed = true
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
    }
  }, [config?.modelPath, character])

  const { scale, offsetY, offsetX, offsetZ } = useMemo(() => {
    if (!model) return { scale: 1, offsetY: 0, offsetX: 0, offsetZ: 0 }
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    return {
      scale: config.height / size.y,
      offsetY: -box.min.y,
      offsetX: -center.x,
      offsetZ: -center.z,
    }
  }, [model, config?.height])

  useFrame((_, delta) => {
    mixerRef.current?.update(delta)
  })

  if (!model) return null

  return (
    <group ref={groupRef} position={position} rotation={[0, facingAngle, 0]}>
      <group scale={scale}>
        <primitive object={model} position={[offsetX, offsetY, offsetZ]} />
      </group>
    </group>
  )
}
