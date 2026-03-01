import { useEffect, useRef } from 'react'
import { handState } from '../../lib/handTracker'

export default function AimReticle() {
    const outerRef = useRef()
    const dotRef = useRef()
    const frameRef = useRef()

    useEffect(() => {
        function update() {
            if (!outerRef.current || !dotRef.current) {
                frameRef.current = requestAnimationFrame(update)
                return
            }

            const el = outerRef.current
            const dot = dotRef.current

            if (handState.active) {
                // Map hand direction to screen position
                // Center of screen = (50%, 50%), hand direction offsets from center
                const cx = 50 + handState.direction.x * 35 // ±35% horizontal
                const cy = 50 - handState.direction.y * 25 // ±25% vertical (inverted)
                el.style.left = `${cx}%`
                el.style.top = `${cy}%`
                el.style.opacity = '1'
                dot.style.background = '#ff5522'
                dot.style.boxShadow = '0 0 12px #ff5522, 0 0 24px #ff552266'
            } else {
                // No hand: center crosshair, dimmed
                el.style.left = '50%'
                el.style.top = '50%'
                el.style.opacity = '0.3'
                dot.style.background = '#c9a533'
                dot.style.boxShadow = '0 0 8px #c9a53366'
            }

            frameRef.current = requestAnimationFrame(update)
        }

        update()
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current)
        }
    }, [])

    return (
        <div
            ref={outerRef}
            style={{
                position: 'fixed',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 1050,
                transition: 'left 0.08s ease-out, top 0.08s ease-out',
            }}
        >
            {/* Outer ring */}
            <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '2px solid rgba(255, 85, 34, 0.5)',
                position: 'absolute',
                top: -20,
                left: -20,
            }} />
            {/* Cross lines */}
            <div style={{
                position: 'absolute',
                width: 16, height: 2,
                background: 'rgba(255, 85, 34, 0.6)',
                top: -1, left: -28,
            }} />
            <div style={{
                position: 'absolute',
                width: 16, height: 2,
                background: 'rgba(255, 85, 34, 0.6)',
                top: -1, left: 12,
            }} />
            <div style={{
                position: 'absolute',
                width: 2, height: 16,
                background: 'rgba(255, 85, 34, 0.6)',
                left: -1, top: -28,
            }} />
            <div style={{
                position: 'absolute',
                width: 2, height: 16,
                background: 'rgba(255, 85, 34, 0.6)',
                left: -1, top: 12,
            }} />
            {/* Center dot */}
            <div
                ref={dotRef}
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#ff5522',
                    position: 'absolute',
                    top: -3,
                    left: -3,
                    boxShadow: '0 0 12px #ff5522, 0 0 24px #ff552266',
                }}
            />
        </div>
    )
}
