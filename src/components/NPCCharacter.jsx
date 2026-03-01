import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { CHARACTER_CONFIGS } from '../data/characterConfigs'
import { NPC_GROUPS, GROUP_SCATTER_RADIUS, ARRIVE_AT_GROUP_DIST } from '../data/groupConfig'
import { npcPositions, npcGroupAssignment } from '../lib/npcStore'

const HALL_X = [-12.6, 12.6]
const HALL_Z = [-49, 49]
const WALK_SPEED = 1.8
const BLEND_DURATION = 0.3

function randomInRange(min, max) {
  return min + Math.random() * (max - min)
}

function randomScatter() {
  const angle = Math.random() * Math.PI * 2
  const r = Math.random() * GROUP_SCATTER_RADIUS
  return [Math.cos(angle) * r, Math.sin(angle) * r]
}

function computeGroupCentroid(groupId, excludeKey) {
  const members = Object.entries(npcGroupAssignment)
    .filter(([k, g]) => g === groupId && k !== excludeKey)
  if (members.length === 0) return null
  let sx = 0, sz = 0, count = 0
  for (const [k] of members) {
    const pos = npcPositions[k]
    if (pos) { sx += pos.x; sz += pos.z; count++ }
  }
  if (count === 0) return null
  return { x: sx / count, z: sz / count }
}

export default function NPCCharacter({
  position = [0, 0, 0],
  rotation = 0,
  character,
  initialGroupId,
}) {
  const config = CHARACTER_CONFIGS[character]
  const groupRef = useRef()
  const [model, setModel] = useState(null)
  const mixerRef = useRef(null)
  const actionsRef = useRef({})
  const currentAnimRef = useRef('idle')

  // Compute initial target from group meeting point
  const initialTarget = useMemo(() => {
    const group = NPC_GROUPS[initialGroupId]
    if (!group) return [position[0], 0, position[2]]
    const scatter = randomScatter()
    return [
      Math.max(HALL_X[0], Math.min(HALL_X[1], group.meetingPoint[0] + scatter[0])),
      0,
      Math.max(HALL_Z[0], Math.min(HALL_Z[1], group.meetingPoint[2] + scatter[1])),
    ]
  }, [initialGroupId, position])

  // Movement state
  const aiRef = useRef({
    state: 'walking_to_group', // 'walking_to_group' | 'idle_in_group' | 'migrating'
    target: initialTarget,
    pos: new THREE.Vector3(position[0], 0, position[2]),
    facing: rotation,
    groupId: initialGroupId,
  })

  // Load model + animations
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
            child.castShadow = false
            child.receiveShadow = false
            child.frustumCulled = true
          }
        })

        const mixer = new THREE.AnimationMixer(fbx)
        mixerRef.current = mixer

        if (fbx.animations.length > 0) {
          const clip = fbx.animations[0]
          clip.name = 'idle'
          const action = mixer.clipAction(clip)
          action.time = Math.random() * (clip.duration || 1)
          action.play()
          actionsRef.current.idle = action
        }

        setModel(fbx)

        // Load walk animation
        const walkPath = config.playerAnims?.walk
        if (walkPath) {
          loader.load(
            walkPath,
            (walkFbx) => {
              if (disposed || !mixerRef.current) return
              if (walkFbx.animations.length > 0) {
                const clip = walkFbx.animations[0]
                clip.name = 'walk'
                const action = mixerRef.current.clipAction(clip)
                actionsRef.current.walk = action
              }
            },
            undefined,
            (err) => console.warn(`[NPC ${character}] Could not load walk:`, err.message)
          )
        }
      },
      undefined,
      (err) => console.warn(`Failed to load FBX for ${character}:`, err.message)
    )

    return () => {
      disposed = true
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
      actionsRef.current = {}
    }
  }, [config?.modelPath, character, config?.playerAnims?.walk])

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

    const ai = aiRef.current
    const group = groupRef.current
    if (!group) return

    // Report position to shared store
    npcPositions[character] = { x: ai.pos.x, z: ai.pos.z }

    // Check for group reassignment (migration)
    const assignedGroup = npcGroupAssignment[character]
    if (assignedGroup && assignedGroup !== ai.groupId) {
      ai.groupId = assignedGroup
      const groupConfig = NPC_GROUPS[assignedGroup]
      if (groupConfig) {
        const scatter = randomScatter()
        ai.target = [
          Math.max(HALL_X[0], Math.min(HALL_X[1], groupConfig.meetingPoint[0] + scatter[0])),
          0,
          Math.max(HALL_Z[0], Math.min(HALL_Z[1], groupConfig.meetingPoint[2] + scatter[1])),
        ]
        ai.state = 'walking_to_group'
      }
    }

    let wantAnim = 'idle'

    if (ai.state === 'idle_in_group') {
      // Face group centroid
      const centroid = computeGroupCentroid(ai.groupId, character)
      if (centroid) {
        const dx = centroid.x - ai.pos.x
        const dz = centroid.z - ai.pos.z
        if (dx * dx + dz * dz > 0.1) {
          const targetAngle = Math.atan2(dx, dz)
          let angleDiff = targetAngle - ai.facing
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
          ai.facing += angleDiff * Math.min(1, 3 * delta)
        }
      }
    } else if (ai.state === 'walking_to_group' || ai.state === 'migrating') {
      const tx = ai.target[0]
      const tz = ai.target[2]
      const dx = tx - ai.pos.x
      const dz = tz - ai.pos.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist < ARRIVE_AT_GROUP_DIST) {
        ai.state = 'idle_in_group'
      } else {
        wantAnim = 'walk'
        const step = Math.min(WALK_SPEED * delta, dist)
        ai.pos.x += (dx / dist) * step
        ai.pos.z += (dz / dist) * step

        ai.pos.x = Math.max(HALL_X[0], Math.min(HALL_X[1], ai.pos.x))
        ai.pos.z = Math.max(HALL_Z[0], Math.min(HALL_Z[1], ai.pos.z))

        const targetAngle = Math.atan2(dx, dz)
        let angleDiff = targetAngle - ai.facing
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
        ai.facing += angleDiff * Math.min(1, 5 * delta)
      }
    }

    // Blend animations
    if (wantAnim !== currentAnimRef.current) {
      const nextAction = actionsRef.current[wantAnim]
      const prevAction = actionsRef.current[currentAnimRef.current]
      if (nextAction) {
        if (prevAction) prevAction.fadeOut(BLEND_DURATION)
        nextAction.reset().fadeIn(BLEND_DURATION).play()
        currentAnimRef.current = wantAnim
      }
    }

    group.position.set(ai.pos.x, 0, ai.pos.z)
    group.rotation.set(0, ai.facing, 0)
  })

  if (!model) return null

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <group scale={scale}>
        <primitive object={model} position={[offsetX, offsetY, offsetZ]} />
      </group>
    </group>
  )
}
