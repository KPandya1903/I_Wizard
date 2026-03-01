import { useMemo } from 'react'
import * as THREE from 'three'
import { HALL, COLORS } from './hallConfig'
import { createBannerTexture } from './houseBannerTextures'

const houses = [
  {
    name: 'Gryffindor',
    color: COLORS.gryffindor,
    emissive: '#ff2200',
    artifactColor: '#ffd700',
    artifactEmissive: '#ffaa00',
  },
  {
    name: 'Ravenclaw',
    color: COLORS.ravenclaw,
    emissive: '#2244ff',
    artifactColor: '#4488ff',
    artifactEmissive: '#2266ff',
  },
  {
    name: 'Hufflepuff',
    color: COLORS.hufflepuff,
    emissive: '#ffcc00',
    artifactColor: '#ffdd44',
    artifactEmissive: '#ffbb00',
  },
  {
    name: 'Slytherin',
    color: COLORS.slytherin,
    emissive: '#00ff44',
    artifactColor: '#22cc44',
    artifactEmissive: '#00aa33',
  },
]

const xPositions = [-12.6, -4.2, 4.2, 12.6]

function Artifact({ house, position }) {
  return (
    <group position={position}>
      {/* Stone pedestal */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[1.5, 2, 1.5]} />
        <meshStandardMaterial color={COLORS.stoneDark} roughness={0.85} />
      </mesh>
      {/* Pedestal cap */}
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[1.8, 0.2, 1.8]} />
        <meshStandardMaterial color={COLORS.stone} roughness={0.8} />
      </mesh>
      {/* Glowing artifact */}
      <mesh position={[0, 3, 0]}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial
          color={house.artifactColor}
          emissive={house.artifactEmissive}
          emissiveIntensity={3}
          toneMapped={false}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>
    </group>
  )
}

function BackWallDisplay({ house, x, texture }) {
  const backZ = -HALL.length / 2 + 1.5

  return (
    <group position={[x, 0, backZ]}>
      {/* Large mural banner on wall */}
      <mesh position={[0, 14, 0]}>
        <planeGeometry args={[10, 14]} />
        <meshStandardMaterial
          map={texture}
          emissive={house.emissive}
          emissiveIntensity={0.15}
          side={THREE.FrontSide}
          roughness={0.85}
        />
      </mesh>

      {/* Decorative border around mural */}
      {/* Top */}
      <mesh position={[0, 21.2, 0.1]}>
        <boxGeometry args={[11, 0.4, 0.3]} />
        <meshStandardMaterial color={COLORS.stoneDark} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, 6.8, 0.1]}>
        <boxGeometry args={[11, 0.4, 0.3]} />
        <meshStandardMaterial color={COLORS.stoneDark} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Left */}
      <mesh position={[-5.2, 14, 0.1]}>
        <boxGeometry args={[0.4, 14.8, 0.3]} />
        <meshStandardMaterial color={COLORS.stoneDark} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Right */}
      <mesh position={[5.2, 14, 0.1]}>
        <boxGeometry args={[0.4, 14.8, 0.3]} />
        <meshStandardMaterial color={COLORS.stoneDark} metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Hanging banner in front of mural */}
      <mesh position={[0, 18, 1.5]}>
        <planeGeometry args={[3, 10]} />
        <meshStandardMaterial
          map={texture}
          side={THREE.DoubleSide}
          roughness={0.9}
        />
      </mesh>

      {/* Artifact on pedestal */}
      <Artifact house={house} position={[0, 0, 4]} />
    </group>
  )
}

function EntranceBanner({ texture, position }) {
  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[2.5, 8]} />
        <meshStandardMaterial
          map={texture}
          side={THREE.DoubleSide}
          roughness={0.9}
        />
      </mesh>
    </group>
  )
}

export default function HouseEndDisplays() {
  const hw = HALL.width / 2
  const entranceZ = HALL.length / 2 - 1

  const textures = useMemo(() => {
    const map = {}
    houses.forEach((h) => {
      map[h.name] = createBannerTexture(h.name)
    })
    return map
  }, [])

  return (
    <group>
      {/* Back wall displays — one per house */}
      {houses.map((house, i) => (
        <BackWallDisplay
          key={house.name}
          house={house}
          x={xPositions[i]}
          texture={textures[house.name]}
        />
      ))}

      {/* Entrance banners — one per house flanking the arch */}
      <EntranceBanner position={[-(hw - 5), HALL.height - 8, entranceZ]} texture={textures.Gryffindor} />
      <EntranceBanner position={[-(hw - 10), HALL.height - 8, entranceZ]} texture={textures.Ravenclaw} />
      <EntranceBanner position={[(hw - 10), HALL.height - 8, entranceZ]} texture={textures.Hufflepuff} />
      <EntranceBanner position={[(hw - 5), HALL.height - 8, entranceZ]} texture={textures.Slytherin} />
    </group>
  )
}
