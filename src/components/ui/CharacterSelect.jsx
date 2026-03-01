import { useState, useRef, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { CHARACTER_CONFIGS } from '../../data/characterConfigs'

const characterKeys = Object.keys(CHARACTER_CONFIGS)

// 3D rotating character preview
function CharacterPreview({ characterKey }) {
  const config = CHARACTER_CONFIGS[characterKey]
  const groupRef = useRef()
  const [model, setModel] = useState(null)
  const mixerRef = useRef(null)

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
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        if (fbx.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(fbx)
          const action = mixer.clipAction(fbx.animations[0])
          action.play()
          mixerRef.current = mixer
        }
        setModel(fbx)
      },
      undefined,
      (err) => console.warn(`[CharacterPreview] Failed to load ${characterKey}:`, err.message)
    )

    return () => {
      disposed = true
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
      setModel(null)
    }
  }, [characterKey, config?.modelPath])

  const { scale, offsetY, offsetX, offsetZ } = useMemo(() => {
    if (!model) return { scale: 1, offsetY: 0, offsetX: 0, offsetZ: 0 }
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const targetHeight = 2.5
    return {
      scale: targetHeight / size.y,
      offsetY: -box.min.y,
      offsetX: -center.x,
      offsetZ: -center.z,
    }
  }, [model])

  // Auto-rotate
  useFrame((_, delta) => {
    mixerRef.current?.update(delta)
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })

  if (!model) return null

  return (
    <group ref={groupRef}>
      <group scale={scale}>
        <primitive object={model} position={[offsetX, offsetY, offsetZ]} />
      </group>
    </group>
  )
}

function CameraTarget() {
  useFrame(({ camera }) => {
    camera.lookAt(0, 1.2, 0)
  })
  return null
}

function LoadingPlaceholder() {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 2
    }
  })
  return (
    <mesh ref={ref}>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#c9a533" emissive="#c9a533" emissiveIntensity={0.5} wireframe />
    </mesh>
  )
}

const keyframes = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(201,165,51,0.4); }
    50% { box-shadow: 0 0 0 4px rgba(201,165,51,0.2); }
  }
`

export default function CharacterSelect({ playerName, onSelect, onBack }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const gridRef = useRef(null)

  // Filter characters by search
  const filteredKeys = useMemo(() => {
    if (!searchQuery.trim()) return characterKeys
    const q = searchQuery.toLowerCase()
    return characterKeys.filter((key) => {
      const config = CHARACTER_CONFIGS[key]
      return config.displayName.toLowerCase().includes(q) || key.includes(q)
    })
  }, [searchQuery])

  const selectedKey = filteredKeys[selectedIndex] || filteredKeys[0]
  const config = selectedKey ? CHARACTER_CONFIGS[selectedKey] : null

  // Clamp selectedIndex when filter changes
  useEffect(() => {
    if (selectedIndex >= filteredKeys.length) {
      setSelectedIndex(Math.max(0, filteredKeys.length - 1))
    }
  }, [filteredKeys.length, selectedIndex])

  const handleSelect = (index) => {
    setSelectedIndex(index)
  }

  const handlePlay = () => {
    if (selectedKey) onSelect(selectedKey)
  }

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.code === 'ArrowLeft') {
        setSelectedIndex((i) => (i - 1 + filteredKeys.length) % filteredKeys.length)
      } else if (e.code === 'ArrowRight') {
        setSelectedIndex((i) => (i + 1) % filteredKeys.length)
      } else if (e.code === 'ArrowUp') {
        setSelectedIndex((i) => Math.max(0, i - 5))
      } else if (e.code === 'ArrowDown') {
        setSelectedIndex((i) => Math.min(filteredKeys.length - 1, i + 5))
      } else if (e.code === 'Enter') {
        handlePlay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Scroll selected grid item into view
  useEffect(() => {
    if (gridRef.current) {
      const item = gridRef.current.children[selectedIndex]
      if (item) item.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex])

  return (
    <div style={styles.container}>
      <style>{keyframes}</style>
      <button style={styles.backBtn} onClick={onBack}>
        Back
      </button>

      <div style={styles.title}>CHOOSE YOUR CHARACTER</div>
      <div style={styles.subtitle}>Welcome, {playerName}</div>

      <div style={styles.mainContent}>
        {/* Left: 3D Preview */}
        <div style={styles.previewSide}>
          <div style={styles.canvasWrapper}>
            <Canvas
              camera={{ position: [0, 1.3, 5], fov: 40 }}
              gl={{ antialias: true }}
              dpr={[1, 2]}
            >
              <CameraTarget />
              <ambientLight intensity={1.5} color="#8888aa" />
              <spotLight position={[2, 4, 3]} angle={0.5} penumbra={0.8} intensity={800} color="#ffe8cc" />
              <spotLight position={[-2, 3, -2]} angle={0.6} penumbra={0.9} intensity={300} color="#4488ff" />
              <Suspense fallback={<LoadingPlaceholder />}>
                {selectedKey && <CharacterPreview characterKey={selectedKey} />}
              </Suspense>
              <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[1.2, 32]} />
                <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.7} />
              </mesh>
              <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.15, 1.25, 32]} />
                <meshStandardMaterial color="#c9a533" emissive="#c9a533" emissiveIntensity={0.8} toneMapped={false} />
              </mesh>
            </Canvas>
          </div>
          {config && (
            <div key={selectedKey} style={styles.charName}>
              {config.displayName}
            </div>
          )}
          <div style={styles.charIndex}>
            {selectedIndex + 1} / {filteredKeys.length}
          </div>
          <button style={styles.playBtn} onClick={handlePlay}>
            PLAY
          </button>
        </div>

        {/* Right: Character Grid */}
        <div style={styles.gridSide}>
          <input
            type="text"
            placeholder="Search characters..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSelectedIndex(0)
            }}
            style={styles.searchInput}
          />
          <div style={styles.grid} ref={gridRef}>
            {filteredKeys.map((key, i) => {
              const c = CHARACTER_CONFIGS[key]
              const isSelected = i === selectedIndex
              return (
                <div
                  key={key}
                  onClick={() => handleSelect(i)}
                  style={{
                    ...styles.gridItem,
                    borderColor: isSelected ? '#c9a533' : '#c9a53333',
                    background: isSelected
                      ? 'rgba(201, 165, 51, 0.15)'
                      : 'rgba(13, 13, 26, 0.6)',
                    animation: isSelected ? 'pulse 1.5s ease infinite' : 'none',
                  }}
                >
                  <div style={styles.gridItemName}>{c.displayName}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0d0d1a 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Georgia', serif",
    overflow: 'hidden',
    padding: '20px',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#c9a533',
    textShadow: '0 0 30px rgba(201,165,51,0.4)',
    letterSpacing: 4,
    marginBottom: 4,
    zIndex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#e8dcc8',
    opacity: 0.6,
    marginBottom: 12,
    letterSpacing: 2,
    zIndex: 1,
  },
  mainContent: {
    display: 'flex',
    gap: 24,
    width: '100%',
    maxWidth: 900,
    flex: 1,
    minHeight: 0,
  },
  previewSide: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 340,
    flexShrink: 0,
  },
  canvasWrapper: {
    width: 300,
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    border: '2px solid #c9a53333',
    background: 'radial-gradient(circle at 50% 60%, #1a0a2e 0%, #0a0a1a 70%)',
  },
  charName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e8dcc8',
    letterSpacing: 3,
    marginTop: 12,
    textShadow: '0 0 20px rgba(201,165,51,0.3)',
    animation: 'fadeIn 0.3s ease',
    textAlign: 'center',
  },
  charIndex: {
    fontSize: 13,
    color: '#c9a53388',
    letterSpacing: 2,
    marginTop: 4,
  },
  playBtn: {
    marginTop: 16,
    padding: '14px 60px',
    background: 'linear-gradient(135deg, #c9a533, #a8872a)',
    border: 'none',
    borderRadius: 8,
    color: '#0d0d1a',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: "'Georgia', serif",
    cursor: 'pointer',
    letterSpacing: 2,
    boxShadow: '0 4px 20px rgba(201,165,51,0.3)',
    transition: 'transform 0.2s',
  },
  gridSide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #c9a53344',
    background: 'rgba(13, 13, 26, 0.8)',
    color: '#e8dcc8',
    fontSize: 14,
    fontFamily: "'Georgia', serif",
    outline: 'none',
    marginBottom: 10,
    boxSizing: 'border-box',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    overflowY: 'auto',
    flex: 1,
    paddingRight: 4,
  },
  gridItem: {
    padding: '10px 8px',
    borderRadius: 8,
    border: '1px solid #c9a53333',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
  },
  gridItemName: {
    fontSize: 12,
    color: '#e8dcc8',
    lineHeight: 1.3,
    wordBreak: 'break-word',
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    background: 'none',
    border: '1px solid #c9a53366',
    color: '#c9a533',
    padding: '8px 16px',
    borderRadius: 6,
    fontSize: 14,
    fontFamily: "'Georgia', serif",
    cursor: 'pointer',
    zIndex: 10,
  },
}
