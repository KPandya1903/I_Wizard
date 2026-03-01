import * as THREE from 'three'

const textureCache = {}

function drawShield(ctx, cx, cy, w, h) {
  ctx.beginPath()
  ctx.moveTo(cx - w / 2, cy - h * 0.4)
  ctx.quadraticCurveTo(cx - w / 2, cy - h * 0.5, cx - w * 0.3, cy - h * 0.5)
  ctx.lineTo(cx + w * 0.3, cy - h * 0.5)
  ctx.quadraticCurveTo(cx + w / 2, cy - h * 0.5, cx + w / 2, cy - h * 0.4)
  ctx.lineTo(cx + w / 2, cy + h * 0.2)
  ctx.quadraticCurveTo(cx + w / 2, cy + h * 0.45, cx, cy + h * 0.55)
  ctx.quadraticCurveTo(cx - w / 2, cy + h * 0.45, cx - w / 2, cy + h * 0.2)
  ctx.closePath()
}

function drawLion(ctx, cx, cy, size) {
  ctx.save()
  ctx.translate(cx, cy)
  // Body
  ctx.beginPath()
  ctx.ellipse(0, 0, size * 0.35, size * 0.25, 0, 0, Math.PI * 2)
  ctx.fill()
  // Head
  ctx.beginPath()
  ctx.arc(size * 0.3, -size * 0.2, size * 0.18, 0, Math.PI * 2)
  ctx.fill()
  // Mane
  ctx.beginPath()
  ctx.arc(size * 0.3, -size * 0.2, size * 0.25, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(size * 0.3, -size * 0.2, size * 0.28, 0, Math.PI * 2)
  ctx.stroke()
  // Front legs
  ctx.fillRect(size * 0.15, size * 0.1, size * 0.08, size * 0.3)
  ctx.fillRect(size * 0.05, size * 0.1, size * 0.08, size * 0.25)
  // Hind legs
  ctx.fillRect(-size * 0.2, size * 0.1, size * 0.08, size * 0.28)
  ctx.fillRect(-size * 0.3, size * 0.12, size * 0.08, size * 0.22)
  // Tail
  ctx.beginPath()
  ctx.moveTo(-size * 0.35, -size * 0.05)
  ctx.quadraticCurveTo(-size * 0.5, -size * 0.4, -size * 0.35, -size * 0.35)
  ctx.stroke()
  // Raised paw
  ctx.fillRect(size * 0.15, -size * 0.1, size * 0.07, size * 0.2)
  ctx.restore()
}

function drawSerpent(ctx, cx, cy, size) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.beginPath()
  ctx.moveTo(-size * 0.3, size * 0.3)
  ctx.bezierCurveTo(-size * 0.4, 0, size * 0.2, size * 0.15, size * 0.1, -size * 0.05)
  ctx.bezierCurveTo(0, -size * 0.2, -size * 0.3, -size * 0.1, -size * 0.15, -size * 0.3)
  ctx.bezierCurveTo(0, -size * 0.5, size * 0.4, -size * 0.3, size * 0.3, -size * 0.15)
  ctx.stroke()
  // Head
  ctx.beginPath()
  ctx.ellipse(size * 0.3, -size * 0.15, size * 0.08, size * 0.05, -0.3, 0, Math.PI * 2)
  ctx.fill()
  // Tongue
  ctx.beginPath()
  ctx.moveTo(size * 0.38, -size * 0.17)
  ctx.lineTo(size * 0.45, -size * 0.22)
  ctx.moveTo(size * 0.38, -size * 0.17)
  ctx.lineTo(size * 0.45, -size * 0.13)
  ctx.stroke()
  ctx.restore()
}

function drawEagle(ctx, cx, cy, size) {
  ctx.save()
  ctx.translate(cx, cy)
  // Body
  ctx.beginPath()
  ctx.ellipse(0, size * 0.05, size * 0.15, size * 0.25, 0, 0, Math.PI * 2)
  ctx.fill()
  // Head
  ctx.beginPath()
  ctx.arc(0, -size * 0.25, size * 0.1, 0, Math.PI * 2)
  ctx.fill()
  // Beak
  ctx.beginPath()
  ctx.moveTo(size * 0.08, -size * 0.25)
  ctx.lineTo(size * 0.2, -size * 0.28)
  ctx.lineTo(size * 0.08, -size * 0.22)
  ctx.fill()
  // Left wing
  ctx.beginPath()
  ctx.moveTo(-size * 0.1, -size * 0.05)
  ctx.quadraticCurveTo(-size * 0.5, -size * 0.3, -size * 0.45, -size * 0.05)
  ctx.quadraticCurveTo(-size * 0.4, size * 0.1, -size * 0.1, size * 0.1)
  ctx.fill()
  // Right wing
  ctx.beginPath()
  ctx.moveTo(size * 0.1, -size * 0.05)
  ctx.quadraticCurveTo(size * 0.5, -size * 0.3, size * 0.45, -size * 0.05)
  ctx.quadraticCurveTo(size * 0.4, size * 0.1, size * 0.1, size * 0.1)
  ctx.fill()
  // Tail feathers
  ctx.beginPath()
  ctx.moveTo(-size * 0.05, size * 0.25)
  ctx.lineTo(-size * 0.1, size * 0.4)
  ctx.lineTo(0, size * 0.35)
  ctx.lineTo(size * 0.1, size * 0.4)
  ctx.lineTo(size * 0.05, size * 0.25)
  ctx.fill()
  ctx.restore()
}

function drawBadger(ctx, cx, cy, size) {
  ctx.save()
  ctx.translate(cx, cy)
  // Body
  ctx.beginPath()
  ctx.ellipse(0, 0, size * 0.35, size * 0.2, 0, 0, Math.PI * 2)
  ctx.fill()
  // Head
  ctx.beginPath()
  ctx.ellipse(size * 0.3, -size * 0.1, size * 0.15, size * 0.12, -0.2, 0, Math.PI * 2)
  ctx.fill()
  // Stripe on head
  ctx.strokeStyle = ctx.fillStyle === '#ffffff' ? '#333' : '#fff'
  ctx.lineWidth = size * 0.04
  ctx.beginPath()
  ctx.moveTo(size * 0.2, -size * 0.22)
  ctx.lineTo(size * 0.42, -size * 0.05)
  ctx.stroke()
  ctx.strokeStyle = ctx.fillStyle
  ctx.lineWidth = size * 0.06
  // Legs
  ctx.fillRect(size * 0.15, size * 0.1, size * 0.08, size * 0.18)
  ctx.fillRect(size * 0.05, size * 0.1, size * 0.08, size * 0.15)
  ctx.fillRect(-size * 0.15, size * 0.1, size * 0.08, size * 0.18)
  ctx.fillRect(-size * 0.25, size * 0.12, size * 0.08, size * 0.15)
  // Tail
  ctx.beginPath()
  ctx.moveTo(-size * 0.35, -size * 0.05)
  ctx.quadraticCurveTo(-size * 0.45, -size * 0.15, -size * 0.4, -size * 0.2)
  ctx.stroke()
  ctx.restore()
}

const houseConfig = {
  Gryffindor: {
    bg: '#740001',
    accent: '#D3A625',
    animal: drawLion,
    motto: 'GRYFFINDOR',
  },
  Slytherin: {
    bg: '#1A472A',
    accent: '#AAAAAA',
    animal: drawSerpent,
    motto: 'SLYTHERIN',
  },
  Ravenclaw: {
    bg: '#0E1A40',
    accent: '#946B2D',
    animal: drawEagle,
    motto: 'RAVENCLAW',
  },
  Hufflepuff: {
    bg: '#ECB939',
    accent: '#372E29',
    animal: drawBadger,
    motto: 'HUFFLEPUFF',
  },
}

export function createBannerTexture(houseName) {
  if (textureCache[houseName]) return textureCache[houseName]

  const config = houseConfig[houseName]
  if (!config) return null

  const w = 256
  const h = 512
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  // Banner background
  ctx.fillStyle = config.bg
  ctx.fillRect(0, 0, w, h)

  // Fabric texture — subtle vertical stripes
  ctx.globalAlpha = 0.08
  for (let x = 0; x < w; x += 4) {
    ctx.fillStyle = x % 8 === 0 ? '#000' : '#fff'
    ctx.fillRect(x, 0, 2, h)
  }
  ctx.globalAlpha = 1

  // Gold border
  ctx.strokeStyle = config.accent
  ctx.lineWidth = 8
  ctx.strokeRect(8, 8, w - 16, h - 16)
  ctx.lineWidth = 3
  ctx.strokeRect(16, 16, w - 32, h - 32)

  // Decorative corner flourishes
  const corners = [[20, 20], [w - 20, 20], [20, h - 20], [w - 20, h - 20]]
  ctx.fillStyle = config.accent
  corners.forEach(([cx, cy]) => {
    ctx.beginPath()
    ctx.arc(cx, cy, 6, 0, Math.PI * 2)
    ctx.fill()
  })

  // Shield background
  const shieldCx = w / 2
  const shieldCy = h * 0.42
  const shieldW = w * 0.6
  const shieldH = h * 0.4

  drawShield(ctx, shieldCx, shieldCy, shieldW, shieldH)
  ctx.fillStyle = config.accent
  ctx.globalAlpha = 0.25
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.strokeStyle = config.accent
  ctx.lineWidth = 3
  ctx.stroke()

  // Animal inside shield
  ctx.fillStyle = config.accent
  ctx.strokeStyle = config.accent
  ctx.lineWidth = w * 0.02
  config.animal(ctx, shieldCx, shieldCy, shieldW * 0.6)

  // House name at top
  ctx.fillStyle = config.accent
  ctx.font = `bold ${w * 0.1}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(config.motto, w / 2, h * 0.1)

  // Decorative line under name
  ctx.strokeStyle = config.accent
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(w * 0.2, h * 0.15)
  ctx.lineTo(w * 0.8, h * 0.15)
  ctx.stroke()

  // Small stars/dots at bottom
  ctx.fillStyle = config.accent
  for (let i = 0; i < 5; i++) {
    const sx = w * 0.3 + i * (w * 0.1)
    ctx.beginPath()
    ctx.arc(sx, h * 0.82, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // Pointed bottom fringe
  ctx.fillStyle = config.bg
  const fringeY = h - 20
  ctx.fillStyle = config.accent
  for (let x = 20; x < w - 20; x += 16) {
    ctx.beginPath()
    ctx.moveTo(x, fringeY)
    ctx.lineTo(x + 8, fringeY + 12)
    ctx.lineTo(x + 16, fringeY)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  textureCache[houseName] = texture
  return texture
}
