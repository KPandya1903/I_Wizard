import { useEffect, useRef, useState } from 'react'
import { startHandTracking, stopHandTracking, getVideoElement, handState } from '../../lib/handTracker'

const GESTURE_LABELS = {
    fist: '✊ Fist → Expelliarmus',
    open: '🖐️ Open → Stupefy',
    peace: '✌️ Peace → Avada Kedavra',
}

const GESTURE_COLORS = {
    fist: '#ff5522',
    open: '#3399ff',
    peace: '#00ee44',
}

export default function HandCamOverlay() {
    const containerRef = useRef()
    const canvasRef = useRef()
    const [ready, setReady] = useState(false)
    const [error, setError] = useState(null)
    const gestureRef = useRef(null)

    useEffect(() => {
        let cancelled = false
        startHandTracking()
            .then((video) => {
                if (cancelled || !containerRef.current) return
                containerRef.current.prepend(video)
                video.style.display = 'block'
                video.style.width = '100%'
                video.style.height = '100%'
                video.style.objectFit = 'cover'
                video.style.transform = 'scaleX(-1)'
                video.style.borderRadius = '10px'
                setReady(true)
            })
            .catch((err) => {
                console.warn('[HandCam] Error:', err.message)
                setError(err.message)
            })

        return () => {
            cancelled = true
            const video = getVideoElement()
            if (video && video.parentNode) {
                video.style.display = 'none'
                document.body.appendChild(video)
            }
            stopHandTracking()
        }
    }, [])

    // Draw landmarks + gesture label
    useEffect(() => {
        if (!ready) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const labelEl = document.getElementById('gesture-label')

        let frameId
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            if (handState.active && handState.landmarks) {
                const lm = handState.landmarks
                const color = GESTURE_COLORS[handState.gesture] || '#c9a533'

                // Draw dots for each landmark
                ctx.fillStyle = color
                for (const point of lm) {
                    const x = (1 - point.x) * canvas.width
                    const y = point.y * canvas.height
                    ctx.beginPath()
                    ctx.arc(x, y, 2, 0, Math.PI * 2)
                    ctx.fill()
                }

                // Draw connections between finger joints
                const fingers = [[0, 1, 2, 3, 4], [0, 5, 6, 7, 8], [0, 9, 10, 11, 12], [0, 13, 14, 15, 16], [0, 17, 18, 19, 20]]
                ctx.strokeStyle = color + '88'
                ctx.lineWidth = 1.5
                for (const f of fingers) {
                    ctx.beginPath()
                    for (let j = 0; j < f.length; j++) {
                        const p = lm[f[j]]
                        const x = (1 - p.x) * canvas.width
                        const y = p.y * canvas.height
                        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                    }
                    ctx.stroke()
                }

                // Update gesture label
                if (labelEl) {
                    const g = handState.gesture
                    labelEl.textContent = GESTURE_LABELS[g] || '...'
                    labelEl.style.color = color
                }
            } else {
                if (labelEl) {
                    labelEl.textContent = 'Show hand'
                    labelEl.style.color = '#c9a53388'
                }
            }

            frameId = requestAnimationFrame(draw)
        }
        draw()
        return () => cancelAnimationFrame(frameId)
    }, [ready])

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                bottom: 16,
                left: 16,
                width: 200,
                height: 170,
                borderRadius: 12,
                border: '2px solid rgba(201,165,51,0.4)',
                overflow: 'hidden',
                zIndex: 1100,
                background: 'rgba(0,0,0,0.5)',
            }}
        >
            {!ready && !error && (
                <div style={{ color: '#c9a533', fontSize: 11, textAlign: 'center', paddingTop: 55 }}>
                    Starting camera...
                </div>
            )}
            {error && (
                <div style={{ color: '#ff4444', fontSize: 10, textAlign: 'center', paddingTop: 50 }}>
                    Camera error:<br />{error}
                </div>
            )}
            <canvas
                ref={canvasRef}
                width={320}
                height={240}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                }}
            />
            {/* Gesture label at bottom */}
            <div
                id="gesture-label"
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 'bold',
                    fontFamily: "'Georgia', serif",
                    padding: '4px 0',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#c9a53388',
                    letterSpacing: 0.5,
                }}
            >
                Show hand
            </div>
        </div>
    )
}
