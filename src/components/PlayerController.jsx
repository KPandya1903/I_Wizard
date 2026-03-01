import { useRef, useEffect, useState, cloneElement, Children } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PLAYER_GROUP_PROXIMITY } from '../data/groupConfig'
import { npcPositions } from '../lib/npcStore'

const DUEL_PROXIMITY = 4
const NPC_COLLISION_RADIUS = 1.1

const WALK_SPEED = 8
const RUN_SPEED = 16
const JUMP_VELOCITY = 12
const GRAVITY = -25
const keys = {}

// Camera
const CAM_DISTANCE_DEFAULT = 8
const CAM_DISTANCE_MIN = 3
const CAM_DISTANCE_MAX = 18
const CAM_MIN_PITCH = -0.35
const CAM_MAX_PITCH = 1.05
const CAM_DEFAULT_PITCH = 0.3
const MOUSE_SENS = 0.002
const SCROLL_SENS = 0.003
const ZOOM_SENS = 0.02
const CAM_LERP = 0.08

// Hall bounds
const BOUND_X = 10.5
const BOUND_Z = 37

// Floor raycasting
const raycaster = new THREE.Raycaster()
const downDir = new THREE.Vector3(0, -1, 0)
const rayOrigin = new THREE.Vector3()

export default function PlayerController({
  children,
  initialPosition = [0, 0, 0],
  groups = [],
  onNearbyGroupChange,
  onNearbyNPCChange,
}) {
  const groupRef = useRef()
  const { camera, scene, gl } = useThree()
  const velocityY = useRef(0)
  const isGrounded = useRef(true)
  const [animState, setAnimState] = useState('idle')
  const nearbyGroupRef = useRef(null)
  const nearbyNPCRef = useRef(null)

  // Keyboard
  useEffect(() => {
    const onKeyDown = (e) => {
      keys[e.code] = true
      if (e.code === 'Space' && isGrounded.current) {
        velocityY.current = JUMP_VELOCITY
        isGrounded.current = false
      }
    }
    const onKeyUp = (e) => { keys[e.code] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // Mouse look state
  const yaw = useRef(0)
  const pitch = useRef(CAM_DEFAULT_PITCH)
  const camDistance = useRef(CAM_DISTANCE_DEFAULT)

  // Mouse / trackpad look — drag to orbit
  useEffect(() => {
    const canvas = gl.domElement
    const dragging = { active: false, startX: 0, startY: 0 }

    const onPointerDown = (e) => {
      dragging.active = true
      dragging.startX = e.clientX
      dragging.startY = e.clientY
      canvas.setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e) => {
      if (!dragging.active) return
      const dx = e.clientX - dragging.startX
      const dy = e.clientY - dragging.startY
      dragging.startX = e.clientX
      dragging.startY = e.clientY
      yaw.current -= dx * MOUSE_SENS
      pitch.current = Math.max(CAM_MIN_PITCH, Math.min(CAM_MAX_PITCH, pitch.current - dy * MOUSE_SENS))
    }

    const onPointerUp = (e) => {
      dragging.active = false
      canvas.releasePointerCapture(e.pointerId)
    }

    // Touchpad: two-finger scroll → orbit, pinch (ctrl+wheel) → zoom
    const onWheel = (e) => {
      e.preventDefault()
      if (e.ctrlKey) {
        // Pinch-to-zoom gesture (macOS sends ctrl+wheel for trackpad pinch)
        camDistance.current = Math.max(
          CAM_DISTANCE_MIN,
          Math.min(CAM_DISTANCE_MAX, camDistance.current + e.deltaY * ZOOM_SENS)
        )
      } else {
        // Two-finger scroll → rotate camera
        yaw.current -= e.deltaX * SCROLL_SENS
        pitch.current = Math.max(
          CAM_MIN_PITCH,
          Math.min(CAM_MAX_PITCH, pitch.current - e.deltaY * SCROLL_SENS)
        )
      }
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  // Set initial position (only on mount)
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...initialPosition)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const pos = groupRef.current.position

    // Input
    const forward = keys['KeyW'] || keys['ArrowUp']
    const back = keys['KeyS'] || keys['ArrowDown']
    const left = keys['KeyA'] || keys['ArrowLeft']
    const right = keys['KeyD'] || keys['ArrowRight']
    const sprinting = keys['ShiftLeft'] || keys['ShiftRight']
    const isMoving = forward || back || left || right

    // Speed
    const speed = (sprinting ? RUN_SPEED : WALK_SPEED) * delta

    // Camera-relative movement direction
    const moveX = (right ? 1 : 0) - (left ? 1 : 0)
    const moveZ = (forward ? -1 : 0) - (back ? -1 : 0)

    if (isMoving) {
      const sinY = Math.sin(yaw.current)
      const cosY = Math.cos(yaw.current)
      const dx = moveX * cosY - moveZ * sinY
      const dz = moveX * sinY + moveZ * cosY
      const len = Math.sqrt(dx * dx + dz * dz) || 1

      pos.x += (dx / len) * speed
      pos.z += (dz / len) * speed
      groupRef.current.rotation.y = Math.atan2(dx, dz)
    }

    // NPC collision — push player out of any overlapping character
    for (const [, npcPos] of Object.entries(npcPositions)) {
      const nx = pos.x - npcPos.x
      const nz = pos.z - npcPos.z
      const dist = Math.sqrt(nx * nx + nz * nz)
      if (dist < NPC_COLLISION_RADIUS && dist > 0.001) {
        const overlap = NPC_COLLISION_RADIUS - dist
        pos.x += (nx / dist) * overlap
        pos.z += (nz / dist) * overlap
      }
    }

    // Clamp to hall bounds
    pos.x = Math.max(-BOUND_X, Math.min(BOUND_X, pos.x))
    pos.z = Math.max(-BOUND_Z, Math.min(BOUND_Z, pos.z))

    // Floor raycasting — exclude player group
    rayOrigin.set(pos.x, pos.y + 5, pos.z)
    raycaster.set(rayOrigin, downDir)
    raycaster.far = 20

    const intersects = raycaster.intersectObjects(scene.children, true)
    let floorY = 0
    for (const hit of intersects) {
      let isPlayer = false
      let obj = hit.object
      while (obj) {
        if (obj === groupRef.current) { isPlayer = true; break }
        obj = obj.parent
      }
      if (isPlayer) continue
      if (hit.object.receiveShadow) {
        floorY = hit.point.y
        break
      }
    }

    // Gravity + jump
    velocityY.current += GRAVITY * delta
    pos.y += velocityY.current * delta

    if (pos.y <= floorY) {
      pos.y = floorY
      velocityY.current = 0
      isGrounded.current = true
    }

    // Animation state
    let newState = 'idle'
    if (!isGrounded.current) {
      newState = 'jump'
    } else if (isMoving && sprinting) {
      newState = 'run'
    } else if (isMoving) {
      newState = 'walk'
    }
    setAnimState(newState)

    // Group proximity detection
    let nearestGroup = null
    let nearestDist = PLAYER_GROUP_PROXIMITY
    for (const group of groups) {
      const dx = pos.x - group.meetingPoint[0]
      const dz = pos.z - group.meetingPoint[2]
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestGroup = group.id
      }
    }
    if (nearestGroup !== nearbyGroupRef.current) {
      nearbyGroupRef.current = nearestGroup
      onNearbyGroupChange?.(nearestGroup)
    }

    // Individual NPC proximity detection for duel
    let nearestNPC = null
    let nearestNPCDist = DUEL_PROXIMITY
    for (const [npcKey, npcPos] of Object.entries(npcPositions)) {
      const dx = pos.x - npcPos.x
      const dz = pos.z - npcPos.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < nearestNPCDist) {
        nearestNPCDist = dist
        nearestNPC = npcKey
      }
    }
    if (nearestNPC !== nearbyNPCRef.current) {
      nearbyNPCRef.current = nearestNPC
      onNearbyNPCChange?.(nearestNPC)
    }

    // Camera — spherical orbit around player
    const dist = camDistance.current
    const camX = pos.x + dist * Math.sin(yaw.current) * Math.cos(pitch.current)
    const camY = pos.y + 2 + dist * Math.sin(pitch.current)
    const camZ = pos.z + dist * Math.cos(yaw.current) * Math.cos(pitch.current)

    const targetCamPos = new THREE.Vector3(camX, camY, camZ)
    const targetLookAt = new THREE.Vector3(pos.x, pos.y + 2, pos.z)

    camera.position.lerp(targetCamPos, CAM_LERP)
    camera.lookAt(targetLookAt)
  })

  const enhancedChildren = Children.map(children, (child) => {
    if (!child) return child
    return cloneElement(child, { animState })
  })

  return <group ref={groupRef}>{enhancedChildren}</group>
}
