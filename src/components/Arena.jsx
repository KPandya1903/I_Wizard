import { HALL, COLORS } from './arena/hallConfig'
import EnchantedCeiling from './arena/EnchantedCeiling'
import GothicColumns from './arena/GothicColumns'
import StainedWindows from './arena/StainedWindows'
import HouseBanners from './arena/HouseBanners'
import WallTorches from './arena/WallTorches'
import GrandEntrance from './arena/GrandEntrance'
import HouseEndDisplays from './arena/HouseEndDisplays'
import Owls from './arena/Owls'
import FloatingCandles from './arena/FloatingCandles'
import Carpet from './arena/Carpet'

export default function Arena() {
  const hw = HALL.width / 2
  const hl = HALL.length / 2
  const hh = HALL.height / 2

  return (
    <group>
      {/* Left wall */}
      <mesh position={[-hw, hh, 0]} receiveShadow>
        <boxGeometry args={[HALL.wallThickness, HALL.height, HALL.length]} />
        <meshStandardMaterial color={COLORS.stoneWall} roughness={0.9} />
      </mesh>
      {/* Right wall */}
      <mesh position={[hw, hh, 0]} receiveShadow>
        <boxGeometry args={[HALL.wallThickness, HALL.height, HALL.length]} />
        <meshStandardMaterial color={COLORS.stoneWall} roughness={0.9} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, hh, -hl]} receiveShadow>
        <boxGeometry args={[HALL.width, HALL.height, HALL.wallThickness]} />
        <meshStandardMaterial color={COLORS.stoneWall} roughness={0.9} />
      </mesh>

      <GrandEntrance />
      <GothicColumns />
      <EnchantedCeiling />
      <StainedWindows />
      <HouseBanners />
      <WallTorches />
      <HouseEndDisplays />
      <FloatingCandles count={60} />
      <Carpet />
    </group>
  )
}
