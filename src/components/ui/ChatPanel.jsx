import { useState, useRef, useEffect } from 'react'
import { chat } from '../../lib/featherless'
import { CHARACTER_CONFIGS } from '../../data/characterConfigs'
import { speak, stopSpeaking, startListening, stopListening, hasVoiceInput } from '../../lib/speak'

const styles = {
  overlay: {
    position: 'fixed',
    bottom: 20,
    right: 20,
    width: 380,
    maxHeight: '60vh',
    background: 'linear-gradient(135deg, #1a0a2e 0%, #0d0d1a 100%)',
    border: '2px solid #c9a533',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Georgia', serif",
    color: '#e8dcc8',
    zIndex: 1000,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #c9a53366',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c9a533',
  },
  closeBtn: {
    background: 'none',
    border: '1px solid #c9a53366',
    color: '#c9a533',
    cursor: 'pointer',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: "'Georgia', serif",
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minHeight: 120,
    maxHeight: '40vh',
  },
  msg: {
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 1.5,
    maxWidth: '90%',
  },
  userMsg: {
    alignSelf: 'flex-end',
    background: '#2a1a40',
    border: '1px solid #4a3080',
  },
  npcMsg: {
    alignSelf: 'flex-start',
    background: '#1a1a2e',
    border: '1px solid #c9a53344',
  },
  thinking: {
    alignSelf: 'flex-start',
    color: '#c9a53388',
    fontStyle: 'italic',
    fontSize: 13,
    padding: '8px 12px',
  },
  inputRow: {
    display: 'flex',
    padding: 10,
    gap: 8,
    borderTop: '1px solid #c9a53366',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    background: '#0d0d1a',
    border: '1px solid #c9a53366',
    borderRadius: 8,
    padding: '8px 12px',
    color: '#e8dcc8',
    fontSize: 14,
    fontFamily: "'Georgia', serif",
    outline: 'none',
  },
  sendBtn: {
    background: '#c9a533',
    border: 'none',
    color: '#0d0d1a',
    padding: '8px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: "'Georgia', serif",
  },
  voiceBtn: {
    background: 'none',
    border: '1px solid #c9a53366',
    color: '#c9a533',
    padding: '8px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 16,
    fontFamily: "'Georgia', serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  voiceBtnActive: {
    background: '#c9a533',
    border: '1px solid #c9a533',
    color: '#0d0d1a',
    padding: '8px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 16,
    fontFamily: "'Georgia', serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    animation: 'pulse 1s infinite',
  },
  recording: {
    alignSelf: 'flex-end',
    color: '#c9a533',
    fontStyle: 'italic',
    fontSize: 13,
    padding: '8px 12px',
  },
  hint: {
    textAlign: 'center',
    color: '#c9a53366',
    fontSize: 11,
    padding: '0 16px 8px',
  },
}

export default function ChatPanel({ character, history, onUpdateHistory, onClose }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const config = CHARACTER_CONFIGS[character]
  if (!config) return null

  useEffect(() => {
    inputRef.current?.focus()
  }, [character])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        stopSpeaking()
        stopListening()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      stopSpeaking()
      stopListening()
    }
  }, [onClose])

  // V key to toggle voice recording (only when input not focused)
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'KeyV' && document.activeElement !== inputRef.current && !loading) {
        e.preventDefault()
        handleVoiceToggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [recording, loading])

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return

    const newHistory = [...history, { role: 'user', content: text.trim() }]
    onUpdateHistory(newHistory)
    setInput('')
    setLoading(true)

    try {
      const messages = [
        { role: 'system', content: config.systemPrompt },
        ...newHistory,
      ]
      const reply = await chat(messages)
      onUpdateHistory([...newHistory, { role: 'assistant', content: reply }])
      speak(reply, character)
    } catch (err) {
      console.error('Chat error:', err)
      onUpdateHistory([
        ...newHistory,
        { role: 'assistant', content: '*The character seems lost in thought...*' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = () => sendMessage(input)

  const handleVoiceToggle = async () => {
    if (recording) {
      stopListening()
      setRecording(false)
      return
    }

    if (!hasVoiceInput) return

    setRecording(true)
    stopSpeaking() // stop NPC speech so mic doesn't pick it up
    try {
      const transcript = await startListening()
      setRecording(false)
      if (transcript) {
        sendMessage(transcript)
      }
    } catch (err) {
      console.warn('Voice input error:', err.message)
      setRecording(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    e.stopPropagation()
  }

  return (
    <div style={styles.overlay}>
      {/* Pulse animation for recording button */}
      {recording && (
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      )}

      <div style={styles.header}>
        <span style={styles.name}>{config.displayName}</span>
        <button style={styles.closeBtn} onClick={onClose}>
          ESC
        </button>
      </div>

      <div style={styles.messages}>
        {history.length === 0 && (
          <div style={{ ...styles.thinking, textAlign: 'center' }}>
            Say something to {config.displayName}...
          </div>
        )}
        {history.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.msg,
              ...(msg.role === 'user' ? styles.userMsg : styles.npcMsg),
            }}
          >
            {msg.content}
          </div>
        ))}
        {recording && <div style={styles.recording}>Listening...</div>}
        {loading && <div style={styles.thinking}>Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputRow}>
        {hasVoiceInput && (
          <button
            style={recording ? styles.voiceBtnActive : styles.voiceBtn}
            onClick={handleVoiceToggle}
            disabled={loading}
            title="Press V to speak"
          >
            {recording ? '...' : 'V'}
          </button>
        )}
        <input
          ref={inputRef}
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={hasVoiceInput ? 'Type or press V to speak...' : 'Type a message...'}
          disabled={loading || recording}
        />
        <button style={styles.sendBtn} onClick={handleSend} disabled={loading || recording}>
          Send
        </button>
      </div>

      {hasVoiceInput && (
        <div style={styles.hint}>Press V to talk with your voice</div>
      )}
    </div>
  )
}
