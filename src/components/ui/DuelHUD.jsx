import { useEffect, useState } from 'react'
import { CHARACTER_CONFIGS } from '../../data/characterConfigs'
import { duelState } from '../../lib/duelStore'
import { SPELL_DEFS } from '../../DuelScene'

export default function DuelHUD({ opponent, onExit, onNextLevel }) {
  const config = CHARACTER_CONFIGS[opponent]
  const name = config?.displayName || opponent

  const [playerHP, setPlayerHP] = useState(100)
  const [opponentHP, setOpponentHP] = useState(100)
  const [opponentMaxHP, setOpponentMaxHP] = useState(100)
  const [cooldowns, setCooldowns] = useState({ q: 0, e: 0, r: 0 })
  const [gameResult, setGameResult] = useState(null)
  const [currentLevel, setCurrentLevel] = useState(1)

  useEffect(() => {
    const id = setInterval(() => {
      setPlayerHP(duelState.playerHP)
      setOpponentHP(duelState.opponentHP)
      setOpponentMaxHP(duelState.opponentMaxHP)
      setCooldowns({ ...duelState.cooldowns })
      setGameResult(duelState.gameResult)
      setCurrentLevel(duelState.currentLevel)
    }, 80)
    return () => clearInterval(id)
  }, [])

  const pct = (v, max) => `${Math.max(0, Math.round(v / max * 100))}%`
  const hpColor = hp => hp > 60 ? '#44cc44' : hp > 30 ? '#ddaa22' : '#cc3333'

  const LEVEL_LABELS = {
    1: 'The Apprentice',
    2: 'The Dark Wizard',
    3: 'The Dark Lord',
  }

  return (
    <div style={s.root}>

      {/* ── Top bar: both names + health ── */}
      <div style={s.topBar}>
        {/* Player side */}
        <div style={s.hpBlock}>
          <span style={s.nameLabel}>YOU</span>
          <div style={s.hpBg}>
            <div style={{ ...s.hpFill, width: pct(playerHP, 100), background: hpColor(playerHP) }} />
          </div>
          <span style={{ ...s.hpNum, color: hpColor(playerHP) }}>{Math.max(0, Math.round(playerHP))}</span>
        </div>

        <div style={s.centerCol}>
          <div style={s.vsText}>⚡ DUEL ⚡</div>
          <div style={s.levelBadge}>LEVEL {currentLevel} · {LEVEL_LABELS[currentLevel]}</div>
        </div>

        {/* Opponent side */}
        <div style={{ ...s.hpBlock, flexDirection: 'row-reverse' }}>
          <span style={s.nameLabel}>{name.toUpperCase()}</span>
          <div style={s.hpBg}>
            <div style={{ ...s.hpFill, width: pct(opponentHP, opponentMaxHP), background: hpColor(opponentHP / opponentMaxHP * 100), marginLeft: 'auto' }} />
          </div>
          <span style={{ ...s.hpNum, color: hpColor(opponentHP / opponentMaxHP * 100) }}>{Math.max(0, Math.round(opponentHP))}</span>
        </div>
      </div>

      {/* ── Spell hotbar ── */}
      <div style={s.spellBar}>
        {['e', 'r', 'f'].map(key => {
          const def = SPELL_DEFS[key]
          const cd = cooldowns[key] || 0
          const maxCd = duelState.maxCooldowns[key]
          const ready = cd <= 0
          const cdPct = ready ? 0 : (cd / maxCd) * 100
          return (
            <div key={key} style={{ ...s.spellSlot, opacity: ready ? 1 : 0.5 }}>
              {/* Cooldown overlay */}
              {!ready && (
                <div style={{ ...s.cdOverlay, height: `${cdPct}%` }} />
              )}
              <div style={{ ...s.spellKey, color: def.color, borderColor: def.color + '88' }}>{key.toUpperCase()}</div>
              <div style={s.spellName}>{def.name}</div>
              {!ready && <div style={s.cdText}>{cd.toFixed(1)}s</div>}
            </div>
          )
        })}
      </div>

      {/* ── Controls hint ── */}
      <div style={s.hint}>WASD move &nbsp;·&nbsp; SPACE jump &nbsp;·&nbsp; ✊🖐️✌️ gestures cast &nbsp;·&nbsp; V voice &nbsp;·&nbsp; ESC exit</div>

      {/* ── Win / Lose overlay ── */}
      {gameResult && (
        <div style={s.resultOverlay}>
          <div style={{ ...s.resultText, color: gameResult === 'win' ? '#44ff88' : '#ff4444' }}>
            {gameResult === 'win' ? '⚡ VICTORY ⚡' : '💀 DEFEATED 💀'}
          </div>
          {gameResult === 'win' && currentLevel < 3 ? (
            <>
              <div style={s.nextLevelHint}>The next challenge awaits...</div>
              <button style={{ ...s.exitBtn, ...s.nextBtn }} onClick={onNextLevel}>
                ⚡ Level {currentLevel + 1} — {LEVEL_LABELS[currentLevel + 1]} ⚡
              </button>
              <button style={s.exitBtn} onClick={onExit}>Return to Hall</button>
            </>
          ) : gameResult === 'win' && currentLevel === 3 ? (
            <>
              <div style={s.gameComplete}>✨ GAME COMPLETE ✨</div>
              <div style={s.nextLevelHint}>You have defeated all three Dark wizards!</div>
              <button style={s.exitBtn} onClick={onExit}>Return to Hall</button>
            </>
          ) : (
            <button style={s.exitBtn} onClick={onExit}>Return to Hall</button>
          )}
        </div>
      )}
    </div>
  )
}

const s = {
  root: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 1000,
    fontFamily: "'Georgia', serif",
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
  },
  topBar: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  hpBlock: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  centerCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
  },
  nameLabel: {
    fontSize: 11,
    color: '#c9a533',
    letterSpacing: 1,
    whiteSpace: 'nowrap',
    minWidth: 40,
  },
  hpBg: {
    flex: 1,
    height: 10,
    background: 'rgba(13,13,26,0.8)',
    border: '1px solid #c9a53344',
    borderRadius: 5,
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    borderRadius: 5,
    transition: 'width 0.25s ease, background 0.25s',
  },
  hpNum: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 28,
    textAlign: 'right',
  },
  vsText: {
    fontSize: 13,
    color: '#c9a533',
    letterSpacing: 3,
    whiteSpace: 'nowrap',
  },
  levelBadge: {
    fontSize: 9,
    color: '#c9a53399',
    letterSpacing: 1.5,
    whiteSpace: 'nowrap',
  },
  spellBar: {
    display: 'flex',
    gap: 10,
    marginBottom: 40,
  },
  spellSlot: {
    position: 'relative',
    width: 72,
    padding: '8px 6px 6px',
    background: 'rgba(13,13,26,0.85)',
    border: '1px solid #c9a53355',
    borderRadius: 8,
    textAlign: 'center',
    overflow: 'hidden',
  },
  cdOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    background: 'rgba(0,0,0,0.55)',
    pointerEvents: 'none',
  },
  spellKey: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  spellName: {
    fontSize: 8,
    color: '#c9a53388',
    letterSpacing: 0.5,
    marginTop: 2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cdText: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  hint: {
    position: 'absolute',
    bottom: 16,
    fontSize: 11,
    color: '#c9a53366',
    letterSpacing: 1,
  },
  resultOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)',
    gap: 16,
    pointerEvents: 'auto',
  },
  resultText: {
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 6,
    textShadow: '0 0 40px currentColor',
  },
  gameComplete: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: '#ffd700',
    textShadow: '0 0 30px #ffd700',
  },
  nextLevelHint: {
    fontSize: 14,
    color: '#c9a533aa',
    letterSpacing: 1,
  },
  exitBtn: {
    background: 'rgba(201,165,51,0.15)',
    border: '1px solid #c9a533',
    color: '#c9a533',
    fontFamily: "'Georgia', serif",
    fontSize: 16,
    padding: '10px 28px',
    borderRadius: 8,
    cursor: 'pointer',
    letterSpacing: 2,
  },
  nextBtn: {
    background: 'rgba(68,255,136,0.15)',
    border: '1px solid #44ff88',
    color: '#44ff88',
    fontSize: 17,
    padding: '12px 32px',
  },
}
