import { CHARACTER_CONFIGS } from '../../data/characterConfigs'

export default function DuelPrompt({ npcKey, isChallenged }) {
  const config = CHARACTER_CONFIGS[npcKey]
  if (!config) return null

  return (
    <div style={styles.container}>
      <div style={styles.prompt}>
        {isChallenged
          ? `${config.displayName} is preparing for battle...`
          : `Hold V and say "I challenge you to a duel!"`}
      </div>
    </div>
  )
}

const styles = {
  container: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  prompt: {
    background: 'rgba(13, 13, 26, 0.85)',
    border: '1px solid #c9a533',
    borderRadius: 20,
    padding: '10px 24px',
    color: '#c9a533',
    fontFamily: "'Georgia', serif",
    fontSize: 16,
    fontWeight: 'bold',
    textShadow: '0 0 10px rgba(201,165,51,0.3)',
    whiteSpace: 'nowrap',
  },
}
