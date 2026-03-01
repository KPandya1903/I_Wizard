export default function DuelWand({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Wand body — brown cylinder pointing along local +z */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.038, 0.38, 8]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Glowing tip */}
      <mesh position={[0, 0, 0.2]}>
        <sphereGeometry args={[0.028, 6, 6]} />
        <meshStandardMaterial color="#fff8e0" emissive="#ffdd88" emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  )
}
