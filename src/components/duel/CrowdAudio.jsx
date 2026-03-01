import { useEffect, useRef } from 'react'

export default function CrowdAudio({ volume = 0.3 }) {
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = new Audio('/audio/crowd-cheering.mp3')
    audio.loop = true
    audio.volume = volume
    audioRef.current = audio

    audio.play().catch(() => {
      // Autoplay blocked — will play on next user interaction
    })

    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  return null
}
