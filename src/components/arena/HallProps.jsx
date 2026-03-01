import { useGLTF } from '@react-three/drei'

useGLTF.preload('/models/harry_potter_hogwarts_sorting_hat/scene.gltf')
useGLTF.preload('/models/harry_potter_suitcase/scene.gltf')
useGLTF.preload('/models/horse_chess_harry_potter/scene.gltf')
useGLTF.preload('/models/nimbus_2000/scene.gltf')

function Prop({ path, position, rotation = [0, 0, 0], scale = 1 }) {
    const { scene } = useGLTF(path)
    const cloned = scene.clone(true)
    cloned.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
        }
    })
    return <primitive object={cloned} position={position} rotation={rotation} scale={scale} />
}

const BROOM = '/models/nimbus_2000/scene.gltf'
const HORSE = '/models/horse_chess_harry_potter/scene.gltf'
const SUITCASE = '/models/harry_potter_suitcase/scene.gltf'
const HAT = '/models/harry_potter_hogwarts_sorting_hat/scene.gltf'

// ── Column Z positions (hall 80 long, 8 columns, spacing = 80/9 ≈ 8.9) ──
//   -31.1, -22.2, -13.3, -4.4, +4.4, +13.3, +22.2, +31.1
// Columns sit at X = ±9.
// Safe midpoints between columns (horses & suitcases go here):
//   -26.7, -17.8, -8.9, 0, +8.9, +17.8, +26.7

// ── Chess horses — lining both sides, between every pillar pair ───────────
// 5 pairs = 10 horses total (was 7 pairs = 14). Fewer high-poly clones = better FPS.
const HORSE_Z = [-26.7, -13.4, 0, 13.4, 26.7]
const HORSE_X = 11   // between column (±9) and wall (±13) — clear of both

// ── Brooms — displayed like a painting flat on the wall face ─────────────
// "Like a painting": vertical, facing into the room, flush against the wall.
// Wall surface at X = ±13. Place broom at X = ±12.5.
// Y rotation faces the broom inward (toward room center).
// Z tilt of ~15° gives a natural slight angle, like it's hanging on a hook.
const BROOM_MOUNTS = [
    { z: -26.7, side: 1 },
    { z: -17.8, side: -1 },
    { z: -8.9, side: 1 },
    { z: 8.9, side: -1 },
    { z: 17.8, side: 1 },
    { z: 26.7, side: -1 },
]
const WALL_X = 12.5

// ── Suitcase clusters ─────────────────────────────────────────────────────
// Horses:    X = ±11,  Z = midpoints (-26.7, -17.8, -8.9, 0, 8.9, 17.8, 26.7)
// Columns:   X = ±9,   Z = -31.1, -22.2, -13.3, -4.4, +4.4, +13.3, +22.2, +31.1
// Suitcases: X = ±7 — 4 units inside the horses, 2 units inside the columns.
//            Z = different from horse Z to avoid any depth overlap too.
const SUITCASE_CLUSTERS = [
    // Entrance right, Z=20 (between horse@17.8 and col@22.2)
    { pos: [7.0, 0, 20], rot: [0, 0.4, 0] },
    { pos: [6.5, 0, 21], rot: [0, -0.3, 0] },
    // Mid-hall left, Z=-3 (between col@-4.4 and horse@0)
    { pos: [-7.0, 0, -3], rot: [0, -0.5, 0] },
    { pos: [-6.5, 0, -2], rot: [0, 0.2, 0] },
    { pos: [-7.0, 0.9, -3], rot: [0, 0.6, 0.03] },
    // Back right, Z=-24 (between col@-22.2 and horse@-26.7)
    { pos: [7.0, 0, -24], rot: [0, -0.3, 0] },
    { pos: [6.5, 0, -23], rot: [0, 0.5, 0] },
    { pos: [7.0, 0.9, -24], rot: [0, -0.1, 0.03] },
    // Back left, Z=-24 (mirror)
    { pos: [-7.0, 0, -24], rot: [0, 0.3, 0] },
    { pos: [-6.5, 0, -23], rot: [0, -0.2, 0] },
    { pos: [-7.0, 0.9, -24], rot: [0, 0.5, 0.04] },
]

export default function HallProps() {
    return (
        <group>

            {/* ♞ Chess Horses — lining both sides between every pillar pair */}
            {HORSE_Z.map((z, i) => (
                <group key={`horses-${i}`}>
                    <Prop
                        path={HORSE}
                        position={[HORSE_X, 0, z]}
                        rotation={[0, -Math.PI * 0.5, 0]}
                        scale={0.07}
                    />
                    <Prop
                        path={HORSE}
                        position={[-HORSE_X, 0, z]}
                        rotation={[0, Math.PI * 0.5, 0]}
                        scale={0.07}
                    />
                </group>
            ))}

            {/* 🧹 Nimbus 2000 — displayed like a painting on the wall face */}
            {/* Vertical, facing into the room, flush against wall surface */}
            {BROOM_MOUNTS.map(({ z, side }, i) => (
                <Prop
                    key={`broom-${i}`}
                    path={BROOM}
                    position={[side * WALL_X, 3, z]}
                    rotation={[
                        0,                              // upright (vertical, like a framed painting)
                        side > 0 ? Math.PI * 0.5 : -Math.PI * 0.5,  // face into the room
                        side * 0.15,                    // slight lean / tilt angle for display look
                    ]}
                    scale={0.04}
                />
            ))}

            {/* 🧳 Suitcases — scattered in 4 clusters, all clear of pillars */}
            {SUITCASE_CLUSTERS.map(({ pos, rot }, i) => (
                <Prop key={`case-${i}`} path={SUITCASE} position={pos} rotation={rot} scale={0.055} />
            ))}

            {/* 🎩 Sorting Hat — back wall center */}
            <Prop
                path={HAT}
                position={[0, 0, -36]}
                rotation={[0, Math.PI * 0.1, 0]}
                scale={0.08}
            />

        </group>
    )
}
