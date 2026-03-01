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

// Hall: 26 wide (half=13). 4 banners each 5 units wide, centred at X=±2.5 and ±7.5
// Outermost edge: 7.5+2.5=10 < 13 ✔
const xPositions = [-7.5, -2.5, 2.5, 7.5]

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
  const backZ = -HALL.length / 2 + 1.2
  // Keep everything within HALL.height (20). Mural: Y=10, height=10 → spans Y=5–15.
  // Hanging banner: Y=13, height=6 → spans Y=10–16.

  return (
    <group position={[x, 0, backZ]}>

      {/* Large mural banner on wall */}
      <mesh position={[0, 10, 0]}>
        <planeGeometry args={[5, 10]} />
        <meshBasicMaterial map={texture} side={THREE.FrontSide} toneMapped={false} />
      </mesh>

      {/* Decorative border — top */}
      <mesh position={[0, 15.3, 0.1]}>
        <boxGeometry args={[5.6, 0.35, 0.25]} />
        <meshStandardMaterial color={COLORS.stoneDark} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* bottom */}
      <mesh position={[0, 4.7, 0.1]}>
        <boxGeometry args={[5.6, 0.35, 0.25]} />
        <meshStandardMaterial color={COLORS.stoneDark} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* left */}
      <mesh position={[-2.8, 10, 0.1]}>
        <boxGeometry args={[0.35, 10.7, 0.25]} />
        <meshStandardMaterial color={COLORS.stoneDark} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* right */}
      <mesh position={[2.8, 10, 0.1]}>
        <boxGeometry args={[0.35, 10.7, 0.25]} />
        <meshStandardMaterial color={COLORS.stoneDark} metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Hanging banner in front of mural */}
      <mesh position={[0, 13, 1.5]}>
        <planeGeometry args={[2, 6]} />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>

      {/* Artifact on pedestal */}
      <Artifact house={house} position={[0, 0, 3]} />
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

      {/* Stable lights for back-wall flags — positioned in front of each banner */}
      {xPositions.map((x, i) => (
        <pointLight
          key={`banner-light-${i}`}
          position={[x, 10, -HALL.length / 2 + 5]}
          color="#fff5dd"
          intensity={3}
          distance={12}
          decay={2}
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
