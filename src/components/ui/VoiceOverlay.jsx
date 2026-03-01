import { CHARACTER_CONFIGS } from '../../data/characterConfigs'
import { npcGroupAssignment } from '../../lib/npcStore'

const styles = {
  container: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  groupLabel: {
    background: 'rgba(13, 13, 26, 0.85)',
    border: '1px solid #c9a533',
    borderRadius: 8,
    padding: '6px 16px',
    color: '#c9a533',
    fontFamily: "'Georgia', serif",
    fontSize: 14,
    textAlign: 'center',
  },
  hint: {
    background: 'rgba(13, 13, 26, 0.7)',
    border: '1px solid #c9a53366',
    borderRadius: 20,
    padding: '8px 20px',
    color: '#e8d8a0',
    fontFamily: "'Georgia', serif",
    fontSize: 15,
  },
  listening: {
    background: 'rgba(201, 165, 51, 0.9)',
    border: '1px solid #c9a533',
    borderRadius: 20,
    padding: '8px 20px',
    color: '#0d0d1a',
    fontFamily: "'Georgia', serif",
    fontSize: 15,
    fontWeight: 'bold',
    animation: 'voicePulse 1s infinite',
  },
  transcript: {
    background: 'rgba(42, 26, 64, 0.9)',
    border: '1px solid #4a3080',
    borderRadius: 8,
    padding: '6px 14px',
    color: '#e8dcc8',
    fontFamily: "'Georgia', serif",
    fontSize: 13,
    fontStyle: 'italic',
    maxWidth: 300,
    textAlign: 'center',
  },
}

export default function VoiceOverlay({ nearbyGroup, isListening, transcript }) {
  if (!nearbyGroup) return null

  const memberNames = Object.entries(npcGroupAssignment)
    .filter(([, gId]) => gId === nearbyGroup)
    .map(([key]) => CHARACTER_CONFIGS[key]?.displayName || key)

  return (
    <div style={styles.container}>
      <style>{`@keyframes voicePulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }`}</style>

      <div style={styles.groupLabel}>
        Nearby: {memberNames.join(', ')}
      </div>

      {transcript && (
        <div style={styles.transcript}>You: &quot;{transcript}&quot;</div>
      )}

      {isListening ? (
        <div style={styles.listening}>Listening...</div>
      ) : (
        <div style={styles.hint}>Press V to speak</div>
      )}
    </div>
  )
}
