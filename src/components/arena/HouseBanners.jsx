import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HALL } from './hallConfig'
import { createBannerTexture } from './houseBannerTextures'

const houseNames = ['Gryffindor', 'Slytherin', 'Ravenclaw', 'Hufflepuff']

export default function HouseBanners() {
  const meshRefs = useRef([])

  const banners = useMemo(() => {
    const items = []
    const spacing = HALL.length / 5
    houseNames.forEach((name, hi) => {
      const z = -HALL.length / 2 + (hi + 1) * spacing
      items.push({ pos: [-(HALL.width / 2) + 4, HALL.height - 6, z], name })
      items.push({ pos: [(HALL.width / 2) - 4, HALL.height - 6, z], name })
    })
    return items
  }, [])

  const textures = useMemo(() => {
    const map = {}
    houseNames.forEach((name) => {
      map[name] = createBannerTexture(name)
    })
    return map
  }, [])

  useFrame((state) => {
    meshRefs.current.forEach((mesh, i) => {
      if (mesh) {
        mesh.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.03
      }
    })
  })

  return (
    <>
      {banners.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => { meshRefs.current[i] = el }}
          position={b.pos}
        >
          <planeGeometry args={[4, 12]} />
          <meshStandardMaterial
            map={textures[b.name]}
            side={THREE.DoubleSide}
            roughness={0.9}
          />
        </mesh>
      ))}
    </>
  )
}
