import { useState } from 'react'

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0d0d1a 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Georgia', serif",
    overflow: 'hidden',
  },
  stars: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(2px 2px at 20% 30%, #c9a53366, transparent),' +
      'radial-gradient(2px 2px at 40% 70%, #c9a53344, transparent),' +
      'radial-gradient(1px 1px at 60% 20%, #c9a53355, transparent),' +
      'radial-gradient(1px 1px at 80% 50%, #c9a53333, transparent),' +
      'radial-gradient(2px 2px at 10% 80%, #c9a53344, transparent),' +
      'radial-gradient(1px 1px at 90% 10%, #c9a53355, transparent),' +
      'radial-gradient(2px 2px at 50% 50%, #c9a53322, transparent),' +
      'radial-gradient(1px 1px at 30% 90%, #c9a53344, transparent)',
    animation: 'twinkle 4s ease-in-out infinite alternate',
    pointerEvents: 'none',
  },
  glow: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,165,51,0.15) 0%, transparent 70%)',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  title: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#c9a533',
    textShadow: '0 0 40px rgba(201,165,51,0.5), 0 0 80px rgba(201,165,51,0.2)',
    letterSpacing: 6,
    marginBottom: 8,
    zIndex: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#e8dcc8',
    opacity: 0.7,
    marginBottom: 50,
    letterSpacing: 3,
    zIndex: 1,
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    zIndex: 1,
  },
  label: {
    fontSize: 16,
    color: '#c9a533',
    letterSpacing: 2,
  },
  input: {
    width: 300,
    padding: '12px 20px',
    background: 'rgba(13, 13, 26, 0.8)',
    border: '2px solid #c9a533',
    borderRadius: 8,
    color: '#e8dcc8',
    fontSize: 18,
    fontFamily: "'Georgia', serif",
    textAlign: 'center',
    outline: 'none',
    letterSpacing: 1,
  },
  button: {
    marginTop: 10,
    padding: '14px 48px',
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
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  onlineButton: {
    padding: '10px 40px',
    background: 'transparent',
    border: '1px solid #c9a53388',
    borderRadius: 8,
    color: '#c9a533',
    fontSize: 15,
    fontFamily: "'Georgia', serif",
    cursor: 'pointer',
    letterSpacing: 2,
    transition: 'border-color 0.2s, opacity 0.2s',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    color: '#c9a53366',
    fontSize: 13,
    letterSpacing: 1,
    zIndex: 1,
  },
}

const keyframes = `
  @keyframes twinkle {
    0% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`

export default function LandingPage({ onContinue, onPlayOnline }) {
  const [name, setName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      onContinue(name.trim())
    }
  }

  const handlePlayOnline = () => {
    if (name.trim()) {
      onPlayOnline(name.trim())
    }
  }

  return (
    <div style={styles.container}>
      <style>{keyframes}</style>
      <div style={styles.stars} />
      <div style={styles.glow} />

      <div style={styles.title}>HOGWARTS</div>
      <div style={styles.subtitle}>THE GREAT HALL EXPERIENCE</div>

      <form style={styles.form} onSubmit={handleSubmit}>
        <div style={styles.label}>ENTER YOUR NAME</div>
        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Wizard name..."
          autoFocus
        />
        <button
          type="submit"
          style={{
            ...styles.button,
            opacity: name.trim() ? 1 : 0.5,
            pointerEvents: name.trim() ? 'auto' : 'none',
          }}
        >
          ENTER
        </button>
        <button
          type="button"
          onClick={handlePlayOnline}
          style={{
            ...styles.onlineButton,
            opacity: name.trim() ? 1 : 0.4,
            pointerEvents: name.trim() ? 'auto' : 'none',
          }}
        >
          ⚡ PLAY ONLINE
        </button>
      </form>

      <div style={styles.footer}>A Hogwarts Interactive Experience</div>
    </div>
  )
}
