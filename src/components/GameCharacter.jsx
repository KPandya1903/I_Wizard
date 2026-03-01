import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { createPortal } from '@react-three/fiber'
import { CHARACTER_CONFIGS } from '../data/characterConfigs'

const BLEND_DURATION = 0.2

// Common right-hand bone names across Mixamo and other rigs
const HAND_BONE_NAMES = [
  'mixamorigRightHand',
  'RightHand',
  'mixamorig:RightHand',
  'mixamorig_RightHand',
  'hand_r',
  'Hand_R',
  'Right_Hand',
  'Bip01_R_Hand',
  'RightHandMiddle1',
]

function findHandBone(root) {
  let found = null
  root.traverse((node) => {
    if (found) return
    if (node.isBone) {
      const name = node.name.toLowerCase()
      for (const candidate of HAND_BONE_NAMES) {
        if (name === candidate.toLowerCase()) {
          found = node
          return
        }
      }
    }
  })
  // Fallback: search for any bone with 'right' and 'hand' in name
  if (!found) {
    root.traverse((node) => {
      if (found) return
      if (node.isBone && node.name.toLowerCase().includes('right') && node.name.toLowerCase().includes('hand')) {
        found = node
      }
    })
  }
  return found
}


export default function GameCharacter({ animState = 'idle', targetHeight = 2, character = 'harry', wandElement = null, castTrigger = 0 }) {
  const config = CHARACTER_CONFIGS[character]
  const ANIM_MAP = useMemo(() => {
    if (config?.playerAnims) return config.playerAnims
    return { idle: config?.modelPath || '/models/Harry_Potter/Idle.fbx' }
  }, [config])
  const groupRef = useRef()
  const mixerRef = useRef(null)
  const actionsRef = useRef({})
  const currentActionRef = useRef(null)
  const [model, setModel] = useState(null)
  const [handBone, setHandBone] = useState(null)
  const recoilRef = useRef(0)
  const lastCastTriggerRef = useRef(0)

  const { charHeight, rotOffset } = useControls('Character', {
    charHeight: { value: targetHeight, min: 0.5, max: 5, step: 0.1, label: 'Height' },
    rotOffset: { value: 0, min: -Math.PI, max: Math.PI, step: 0.05, label: 'Rotation' },
  })

  // Load FBX files
  useEffect(() => {
    const loader = new FBXLoader()
    let disposed = false
    const entries = Object.entries(ANIM_MAP)

    loader.load(
      ANIM_MAP.idle,
      (fbx) => {
        if (disposed) return

        fbx.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = false
            child.frustumCulled = true
          }
        })

        // Set up mixer and idle animation
        mixerRef.current = new THREE.AnimationMixer(fbx)
        if (fbx.animations.length > 0) {
          const clip = fbx.animations[0]
          clip.name = 'idle'
          const action = mixerRef.current.clipAction(clip)
          actionsRef.current.idle = action
          action.play()
          currentActionRef.current = action
        }

        // Find right hand bone for wand attachment
        const bone = findHandBone(fbx)
        if (bone) setHandBone(bone)

        setModel(fbx)

        // Load remaining animations in background
        const remaining = entries.filter(([name]) => name !== 'idle')
        remaining.forEach(([name, path]) => {
          loader.load(
            path,
            (animFbx) => {
              if (disposed || !mixerRef.current) return
              if (animFbx.animations.length > 0) {
                const clip = animFbx.animations[0]
                clip.name = name
                const action = mixerRef.current.clipAction(clip)
                if (name === 'jump' || name === 'dying') {
                  action.setLoop(THREE.LoopOnce)
                  action.clampWhenFinished = true
                }
                actionsRef.current[name] = action
              }
            },
            undefined,
            (err) => console.warn(`[GameCharacter] Could not load ${name}: ${err.message}`)
          )
        })
      },
      undefined,
      (err) => console.error('[GameCharacter] FAILED to load Idle.fbx:', err)
    )

    return () => {
      disposed = true
      mixerRef.current?.stopAllAction()
    }
  }, [ANIM_MAP])

  // Auto-scale model to target height, feet at y=0
  const { scale, offsetY, offsetX, offsetZ } = useMemo(() => {
    if (!model) return { scale: 1, offsetY: 0, offsetX: 0, offsetZ: 0 }
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const s = charHeight / size.y
    return {
      scale: s,
      offsetY: -box.min.y,
      offsetX: -center.x,
      offsetZ: -center.z,
    }
  }, [model, charHeight])

  // Switch animations
  useEffect(() => {
    const targetAction = actionsRef.current[animState]
    if (!targetAction || !mixerRef.current) return
    if (currentActionRef.current === targetAction) return

    const prev = currentActionRef.current
    if (prev) prev.fadeOut(BLEND_DURATION)
    targetAction.reset().fadeIn(BLEND_DURATION).play()
    currentActionRef.current = targetAction
  }, [animState])

  // Recoil trigger check
  if (castTrigger !== lastCastTriggerRef.current) {
    lastCastTriggerRef.current = castTrigger
    if (castTrigger > 0) {
      recoilRef.current = 1.0 // Start full recoil
    }
  }

  useFrame((_, delta) => {
    mixerRef.current?.update(delta)

    if (recoilRef.current > 0 && handBone) {
      // The Mixamo rig right hand bone locally points down its Y-axis. 
      // Rotating around X folds it forward/inward.
      const recoilAmt = Math.sin(recoilRef.current * Math.PI) * 1.2
      handBone.rotation.x += recoilAmt

      recoilRef.current -= delta * 4.0 // Fast recovery
      if (recoilRef.current < 0) recoilRef.current = 0
    }
  })

  if (!model) return null

  return (
    <group ref={groupRef} rotation={[0, rotOffset, 0]}>
      <group scale={scale}>
        <primitive object={model} position={[offsetX, offsetY, offsetZ]} />
      </group>
      {handBone && wandElement && createPortal(
        <group scale={1 / scale}>
          {wandElement}
        </group>,
        handBone
      )}
    </group>
  )
}
