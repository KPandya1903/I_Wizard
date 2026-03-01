import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { useControls } from 'leva'
import Lighting from './components/Lighting'
import Effects from './components/Effects'
import Arena from './components/Arena'
import GameCharacter from './components/GameCharacter'
import PlayerController from './components/PlayerController'
import NPCCharacter from './components/NPCCharacter'
import NPCConversationManager from './components/NPCConversationManager'
import DuelScene from './DuelScene'
import DuelSceneMultiplayer from './DuelSceneMultiplayer'
import { NPC_PLACEMENTS, CHARACTER_CONFIGS } from './data/characterConfigs'
import { NPC_GROUPS } from './data/groupConfig'

export default function Scene({
  selectedCharacter,
  onNearbyGroupChange,
  onNearbyNPCChange,
  mode = 'hall',
  duelOpponent,
  duelKey,
  mpOpponentCharacter,
  mpIsHost,
  mpSendData,
  mpOnRegisterReceiver,
}) {
  const { showGrid } = useControls('Debug', {
    showGrid: { value: false, label: 'Show Grid' },
  })

  // Filter out the selected character from NPCs
  const npcEntries = useMemo(() => {
    return Object.entries(NPC_PLACEMENTS).filter(([name]) => name !== selectedCharacter)
  }, [selectedCharacter])

  // Group meeting points for PlayerController proximity detection
  const groupsList = useMemo(() => {
    return Object.entries(NPC_GROUPS).map(([id, g]) => ({
      id,
      meetingPoint: g.meetingPoint,
    }))
  }, [])

  const playerHeight = CHARACTER_CONFIGS[selectedCharacter]?.height || 2

  return (
    <Canvas
      shadows
      camera={{
        position: (mode === 'duel' || mode === 'multiplayer') ? [15, 8, 0] : [0, 5.6, 52],
        fov: (mode === 'duel' || mode === 'multiplayer') ? 50 : 60,
        near: 0.1,
        far: 500,
      }}
      gl={{
        antialias: false,
        toneMapping: 0,
        outputColorSpace: 'srgb',
        powerPreference: 'high-performance',
      }}
      dpr={1}
      performance={{ min: 0.5 }}
    >
      {mode === 'hall' && (
        <>
          <fog attach="fog" args={['#1a1a2e', 84, 245]} />
          <Lighting />
          <Arena />

          <PlayerController
            initialPosition={[0, 0, 42]}
            groups={groupsList}
            onNearbyGroupChange={onNearbyGroupChange}
            onNearbyNPCChange={onNearbyNPCChange}
          >
            <GameCharacter targetHeight={playerHeight} character={selectedCharacter} />
          </PlayerController>

          {npcEntries.map(([name, p]) => {
            const initialGroupId = Object.entries(NPC_GROUPS)
              .find(([, g]) => g.members.includes(name))?.[0] || Object.keys(NPC_GROUPS)[0]
            return (
              <NPCCharacter
                key={name}
                character={name}
                position={p.position}
                rotation={p.rotation}
                initialGroupId={initialGroupId}
              />
            )
          })}

          <Sparkles count={25} scale={[38, 24, 133]} size={2} speed={0.15} color="#6633ff" />
          <NPCConversationManager excludeCharacter={selectedCharacter} />
          <Effects />

          {showGrid && <gridHelper args={[140, 35, '#555', '#333']} />}
        </>
      )}

      {mode === 'duel' && (
        <DuelScene key={duelKey} selectedCharacter={selectedCharacter} opponent={duelOpponent} />
      )}

      {mode === 'multiplayer' && (
        <DuelSceneMultiplayer
          selectedCharacter={selectedCharacter}
          opponentCharacter={mpOpponentCharacter || 'aj'}
          isHost={mpIsHost}
          sendData={mpSendData}
          onRegisterReceiver={mpOnRegisterReceiver}
        />
      )}
    </Canvas>
  )
}
