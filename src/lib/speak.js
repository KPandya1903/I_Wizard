// ElevenLabs TTS + browser Speech Recognition

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY
const OPPONENT_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID
const ELEVENLABS_URL = 'https://api.elevenlabs.io/v1/text-to-speech'

// ElevenLabs pre-made voice IDs — each character gets a distinct voice
const VOICE_MAP = {
  harry: 'pNInz6obpgDQGcFmaJgB',
  erika: 'EXAVITQu4vr4xnSDxMaL',
  mutant: 'VR6AewLTigWG4xSOukaG',
  peasant: 'MF3mGyEYCl7XYWbV9V6O',
  remy: 'TxGEqnHWrfWFTfGW9XjX',
  boss: 'ErXwobaYiN019PkySvjV',
  vanguard: '2EiwWnXFnvU5JabPnv8n',
  warrock: 'onwK4e9ZLuTAKqWW03F9',
  // generated characters cycle through available voices
  abe: 'pNInz6obpgDQGcFmaJgB',
  aciana: 'EXAVITQu4vr4xnSDxMaL',
  adam: 'TxGEqnHWrfWFTfGW9XjX',
  aiden: 'VR6AewLTigWG4xSOukaG',
  aj: 'ErXwobaYiN019PkySvjV',
  villian: OPPONENT_VOICE_ID,
}

// --- Web Audio API (bypasses autoplay policy once unlocked) ---
let audioCtx = null
let currentSource = null
let opponentSource = null
let preloadedArrayBuffers = {} // { [voiceId_text]: ArrayBuffer }

export function getAudioContext() {
  if (!audioCtx) {
    // @ts-ignore
    const Ctx = window.AudioContext || window.webkitAudioContext
    audioCtx = new Ctx()
  }
  return audioCtx
}

export function unlockAudioContext() {
  if (typeof window === 'undefined') return
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  // Play a silent oscillator for 1ms to formally unlock audio in Safari/Chrome
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  gain.gain.value = 0
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(0)
  osc.stop(ctx.currentTime + 0.001)
}

export function stopSpeaking() {
  try { currentSource?.stop() } catch (_) { }
  currentSource = null
  try { opponentSource?.stop() } catch (_) { }
  opponentSource = null
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel()
  }
}

// Fire-and-forget opponent TTS using the custom trained voice ID
export async function speakAsOpponent(text) {
  try { opponentSource?.stop() } catch (_) { }
  opponentSource = null

  if (!ELEVENLABS_API_KEY || !OPPONENT_VOICE_ID) return

  try {
    const res = await fetch(`${ELEVENLABS_URL}/${OPPONENT_VOICE_ID}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
    })

    if (!res.ok) return

    const arrayBuffer = await res.arrayBuffer()
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') { try { await ctx.resume() } catch (_) { } }

    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(ctx.destination)
    source.onended = () => { opponentSource = null }
    opponentSource = source
    source.start()
  } catch (err) {
    console.warn('Opponent TTS error:', err.message)
  }
}

export async function speak(text, characterKey) {
  stopSpeaking()

  const voiceId = VOICE_MAP[characterKey] || VOICE_MAP.harry

  if (!ELEVENLABS_API_KEY) {
    return fallbackSpeak(text)
  }

  try {
    const res = await fetch(`${ELEVENLABS_URL}/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
      }),
    })

    if (!res.ok) {
      console.warn('ElevenLabs error:', res.status)
      return fallbackSpeak(text)
    }

    const arrayBuffer = await res.arrayBuffer()
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      try { await ctx.resume() } catch (e) { }
    }

    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

    return new Promise((resolve) => {
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)

      const durationMs = (audioBuffer.duration * 1000) || 3000
      let resolved = false
      const safeResolve = () => { if (!resolved) { resolved = true; resolve() } }

      source.onended = () => {
        currentSource = null
        safeResolve()
      }
      currentSource = source
      source.start()
      setTimeout(safeResolve, durationMs + 500) // Fallback timeout so we never hang
    })
  } catch (err) {
    console.warn('ElevenLabs error:', err.message)
    return fallbackSpeak(text)
  }
}

export async function preloadAudio(text, characterKey) {
  const voiceId = VOICE_MAP[characterKey] || VOICE_MAP.harry
  const cacheKey = `${voiceId}_${text}`

  if (preloadedArrayBuffers[cacheKey]) return true

  if (!ELEVENLABS_API_KEY) return false

  try {
    const res = await fetch(`${ELEVENLABS_URL}/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
      }),
    })

    if (!res.ok) return false

    const arrayBuffer = await res.arrayBuffer()
    preloadedArrayBuffers[cacheKey] = arrayBuffer
    return true
  } catch (err) {
    console.warn('Preload error:', err.message)
    return false
  }
}

export async function playPreloadedAudio(text, characterKey) {
  const voiceId = VOICE_MAP[characterKey] || VOICE_MAP.harry
  const cacheKey = `${voiceId}_${text}`
  const originalBuffer = preloadedArrayBuffers[cacheKey]

  if (!originalBuffer) {
    return speak(text, characterKey) // Fallback to live fetch
  }

  stopSpeaking()
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    try { await ctx.resume() } catch (e) { }
  }

  let audioBuffer
  try {
    // decodeAudioData detaches the arrayBuffer. We MUST clone it to reuse it later if needed.
    const bufferClone = originalBuffer.slice(0)
    audioBuffer = await ctx.decodeAudioData(bufferClone)
  } catch (e) {
    console.warn('Preloaded decode error:', e)
    return speak(text, characterKey)
  }

  return new Promise((resolve) => {
    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(ctx.destination)

    const durationMs = (audioBuffer.duration * 1000) || 3000
    let resolved = false
    const safeResolve = () => { if (!resolved) { resolved = true; resolve() } }

    source.onended = () => {
      currentSource = null
      safeResolve()
    }
    currentSource = source
    source.start()
    setTimeout(safeResolve, durationMs + 500) // Fallback timeout so we never hang
  })
}

function fallbackSpeak(text) {
  if (typeof speechSynthesis === 'undefined') return Promise.resolve()
  speechSynthesis.cancel()
  return new Promise(resolve => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.onend = resolve
    utterance.onerror = resolve
    speechSynthesis.speak(utterance)
  })
}

// --- Speech Recognition ---
const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

let recognizer = null

export function startListening() {
  if (!SpeechRecognition) {
    return Promise.reject(new Error('Speech recognition not supported'))
  }

  return new Promise((resolve, reject) => {
    recognizer = new SpeechRecognition()
    recognizer.lang = 'en-US'
    recognizer.interimResults = false
    recognizer.maxAlternatives = 1
    recognizer.continuous = false

    recognizer.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      resolve(transcript)
    }

    recognizer.onerror = (event) => {
      reject(new Error(event.error))
    }

    recognizer.onend = () => {
      recognizer = null
    }

    recognizer.start()
  })
}

export function stopListening() {
  if (recognizer) {
    recognizer.stop()
    recognizer = null
  }
}

export const hasVoiceInput = !!SpeechRecognition
