// Hand tracking via MediaPipe HandLandmarker
// Detects hand gestures (fist, open hand, peace sign) from webcam

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

// ── Shared state (read by DuelScene each frame) ──
export const handState = {
    active: false,         // true when hand is detected
    gesture: null,         // 'fist' | 'open' | 'peace' | null
    landmarks: null,       // raw 21 landmarks (for overlay drawing)
}

let handLandmarker = null
let videoElement = null
let animFrameId = null
let running = false

// ── Initialise MediaPipe ──
async function initLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    )
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
    })
}

// ── Gesture detection from landmarks ──
// Landmark indices: 0=wrist, 4=thumb tip, 8=index tip, 12=middle tip, 16=ring tip, 20=pinky tip
// PIP joints: 6=index PIP, 10=middle PIP, 14=ring PIP, 18=pinky PIP
// MCP joints: 5=index MCP, 9=middle MCP, 13=ring MCP, 17=pinky MCP

function isFingerExtended(landmarks, tipIdx, pipIdx) {
    // A finger is extended if the tip is above (lower y) the PIP joint
    return landmarks[tipIdx].y < landmarks[pipIdx].y
}

function detectGesture(landmarks) {
    const indexUp = isFingerExtended(landmarks, 8, 6)
    const middleUp = isFingerExtended(landmarks, 12, 10)
    const ringUp = isFingerExtended(landmarks, 16, 14)
    const pinkyUp = isFingerExtended(landmarks, 20, 18)

    // Count extended fingers (excluding thumb — less reliable)
    const extendedCount = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length

    // FIST: no fingers extended (0 or maybe 1)
    if (extendedCount <= 0) return 'fist'

    // PEACE: index + middle up, ring + pinky down
    if (indexUp && middleUp && !ringUp && !pinkyUp) return 'peace'

    // OPEN HAND: 3+ fingers extended
    if (extendedCount >= 3) return 'open'

    return null
}

// ── Detection loop (throttled to ~10 FPS for performance) ──
let lastTimestamp = -1
const DETECT_INTERVAL = 100 // ms between detections
let lastDetectTime = 0

function detect() {
    if (!running || !videoElement || !handLandmarker) return

    const now = performance.now()
    if (now - lastDetectTime >= DETECT_INTERVAL && videoElement.readyState >= 2) {
        lastDetectTime = now
        if (now > lastTimestamp) {
            const results = handLandmarker.detectForVideo(videoElement, now)
            lastTimestamp = now

            if (results.landmarks && results.landmarks.length > 0) {
                const lm = results.landmarks[0]
                handState.active = true
                handState.landmarks = lm
                handState.gesture = detectGesture(lm)
            } else {
                handState.active = false
                handState.landmarks = null
                handState.gesture = null
            }
        }
    }

    animFrameId = requestAnimationFrame(detect)
}

// ── Public API ──

export async function startHandTracking() {
    if (running) return videoElement

    if (!handLandmarker) {
        await initLandmarker()
    }

    videoElement = document.createElement('video')
    videoElement.setAttribute('playsinline', '')
    videoElement.setAttribute('autoplay', '')
    videoElement.style.display = 'none'
    document.body.appendChild(videoElement)

    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
    })
    videoElement.srcObject = stream
    await videoElement.play()

    running = true
    lastTimestamp = -1
    detect()

    return videoElement
}

export function stopHandTracking() {
    running = false
    if (animFrameId) {
        cancelAnimationFrame(animFrameId)
        animFrameId = null
    }
    if (videoElement) {
        const stream = videoElement.srcObject
        if (stream) {
            stream.getTracks().forEach(t => t.stop())
        }
        videoElement.remove()
        videoElement = null
    }
    handState.active = false
    handState.landmarks = null
    handState.gesture = null
}

export function getVideoElement() {
    return videoElement
}
