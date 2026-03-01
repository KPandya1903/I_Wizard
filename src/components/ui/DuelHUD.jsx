import { useEffect, useState } from 'react'
import { CHARACTER_CONFIGS } from '../../data/characterConfigs'
import { duelState } from '../../lib/duelStore'
import { SPELL_DEFS } from '../../DuelScene'

/* ─── CSS keyframes injected once ────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Cinzel+Decorative:wght@700&display=swap');

  @keyframes hpPulse {
    0%,100% { box-shadow: 0 0 6px currentColor; }
    50%      { box-shadow: 0 0 18px currentColor, 0 0 36px currentColor; }
  }
  @keyframes hpShake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-4px); }
    40%     { transform: translateX(4px); }
    60%     { transform: translateX(-3px); }
    80%     { transform: translateX(3px); }
  }
  @keyframes victoryPulse {
    0%,100% { text-shadow: 0 0 30px #44ff88, 0 0 60px #44ff88; }
    50%     { text-shadow: 0 0 60px #44ff88, 0 0 100px #44ff88, 0 0 150px #44ff8844; }
  }
  @keyframes defeatPulse {
    0%,100% { text-shadow: 0 0 30px #ff4444, 0 0 60px #ff4444; }
    50%     { text-shadow: 0 0 60px #ff4444, 0 0 100px #ff4444, 0 0 150px #ff444444; }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes spellReady {
    0%   { box-shadow: 0 0 0px transparent; }
    50%  { box-shadow: 0 0 14px var(--sc), 0 0 28px var(--sc); }
    100% { box-shadow: 0 0 6px var(--sc); }
  }
  @keyframes levelBadgeGlow {
    0%,100% { opacity: 0.8; }
    50%     { opacity: 1; text-shadow: 0 0 16px currentColor; }
  }
  @keyframes auraRing {
    from { transform: scale(0.95) rotate(0deg); opacity: 0.7; }
    to   { transform: scale(1.05) rotate(360deg); opacity: 0.4; }
  }
  @keyframes overlayIn {
    from { opacity: 0; backdrop-filter: blur(0px); }
    to   { opacity: 1; backdrop-filter: blur(6px); }
  }

  .spell-slot-ready { animation: spellReady 1.6s ease-in-out infinite; }
  .hp-crit { animation: hpPulse 0.8s ease-in-out infinite; }
  .hp-hurt { animation: hpShake 0.4s ease; }
  .victory-text { animation: victoryPulse 1.5s ease-in-out infinite; }
  .defeat-text  { animation: defeatPulse 1.5s ease-in-out infinite; }
  .duel-btn {
    background: linear-gradient(135deg, rgba(201,165,51,0.12), rgba(201,165,51,0.06));
    border: 1px solid #c9a533;
    color: #c9a533;
    font-family: 'Cinzel', serif;
    font-size: 13px;
    letter-spacing: 3px;
    padding: 12px 32px;
    border-radius: 2px;
    cursor: pointer;
    transition: background 0.2s, box-shadow 0.2s, letter-spacing 0.2s;
    text-transform: uppercase;
  }
  .duel-btn:hover {
    background: rgba(201,165,51,0.22);
    box-shadow: 0 0 24px rgba(201,165,51,0.35), inset 0 0 12px rgba(201,165,51,0.08);
    letter-spacing: 4px;
  }
  .next-btn {
    background: linear-gradient(135deg, rgba(68,255,136,0.14), rgba(68,255,136,0.06));
    border-color: #44ff88;
    color: #44ff88;
    font-size: 14px;
    padding: 14px 40px;
  }
  .next-btn:hover {
    background: rgba(68,255,136,0.26);
    box-shadow: 0 0 32px rgba(68,255,136,0.4);
  }
`

const LEVEL_LABELS = { 1: 'The Apprentice', 2: 'The Dark Wizard', 3: 'The Dark Lord' }
const LEVEL_COLORS = { 1: '#c9a533', 2: '#ff6633', 3: '#cc44ff' }

export default function DuelHUD({ opponent, onExit, onNextLevel, playerName, opponentName }) {
  const config = CHARACTER_CONFIGS[opponent]
  const name = opponentName || config?.displayName || opponent

  const [playerHP, setPlayerHP] = useState(100)
  const [opponentHP, setOpponentHP] = useState(100)
  const [opponentMaxHP, setOpponentMaxHP] = useState(100)
  const [cooldowns, setCooldowns] = useState({ e: 0, r: 0, f: 0 })
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
  const hpColor = hp => hp > 60 ? '#44dd66' : hp > 30 ? '#ddaa22' : '#ee3333'
  const lvlColor = LEVEL_COLORS[currentLevel] || '#c9a533'

  return (
    <div style={s.root}>
      <style>{CSS}</style>

      {/* ── TOP BAR ── */}
      <div style={s.topBar}>

        {/* Player HP panel */}
        <div style={s.hpPanel}>
          <div style={s.hpHeader}>
            <span style={s.fighterTag}>⚡ {playerName ? playerName.toUpperCase() : 'YOU'}</span>
            <span style={{ ...s.hpNum, color: hpColor(playerHP) }}>{Math.max(0, Math.round(playerHP))}</span>
          </div>
          <div style={s.hpTrack}>
            <div style={{
              ...s.hpFill,
              width: pct(playerHP, 100),
              background: `linear-gradient(90deg, ${hpColor(playerHP)}, ${hpColor(playerHP)}aa)`,
              boxShadow: `0 0 12px ${hpColor(playerHP)}88`,
            }} className={playerHP < 25 ? 'hp-crit' : ''} />
            {/* segment ticks */}
            {[25, 50, 75].map(v => (
              <div key={v} style={{ ...s.hpTick, left: `${v}%` }} />
            ))}
          </div>
        </div>

        {/* Center: level + vs */}
        <div style={s.centerCol}>
          <div style={{ ...s.levelBadge, color: lvlColor, borderColor: lvlColor + '66' }}
            className="levelBadgeGlow">
            LVL {currentLevel}
          </div>
          <div style={s.vsGlyph}>⚔</div>
          <div style={{ fontSize: 9, color: lvlColor + 'aa', letterSpacing: 2, fontFamily: "'Cinzel', serif" }}>
            {LEVEL_LABELS[currentLevel]}
          </div>
        </div>

        {/* Opponent HP panel */}
        <div style={{ ...s.hpPanel, alignItems: 'flex-end' }}>
          <div style={{ ...s.hpHeader, flexDirection: 'row-reverse' }}>
            <span style={{ ...s.fighterTag, color: '#cc4444' }}>{name.toUpperCase()} ☠</span>
            <span style={{ ...s.hpNum, color: hpColor(opponentHP / opponentMaxHP * 100) }}>
              {Math.max(0, Math.round(opponentHP))}
            </span>
          </div>
          <div style={{ ...s.hpTrack, transform: 'scaleX(-1)' }}>
            <div style={{
              ...s.hpFill,
              width: pct(opponentHP, opponentMaxHP),
              background: `linear-gradient(90deg, ${hpColor(opponentHP / opponentMaxHP * 100)}, ${hpColor(opponentHP / opponentMaxHP * 100)}aa)`,
              boxShadow: `0 0 12px ${hpColor(opponentHP / opponentMaxHP * 100)}88`,
            }} className={opponentHP / opponentMaxHP < 0.25 ? 'hp-crit' : ''} />
            {[25, 50, 75].map(v => (
              <div key={v} style={{ ...s.hpTick, left: `${v}%` }} />
            ))}
          </div>
        </div>

      </div>

      {/* ── SPELL HOTBAR ── */}
      <div style={s.spellBar}>
        {['e', 'r', 'f'].map(key => {
          const def = SPELL_DEFS[key]
          const cd = cooldowns[key] || 0
          const maxCd = duelState.maxCooldowns[key]
          const ready = cd <= 0
          const cdPct = ready ? 0 : (cd / maxCd) * 100

          return (
            <div
              key={key}
              className={ready ? 'spell-slot-ready' : ''}
              style={{
                ...s.spellSlot,
                '--sc': def.color,
                borderColor: ready ? def.color + 'cc' : def.color + '33',
                opacity: ready ? 1 : 0.55,
              }}
            >
              {/* sweep cooldown fill */}
              {!ready && <div style={{ ...s.cdSweep, height: `${cdPct}%` }} />}

              <div style={{ ...s.spellIcon, color: def.color }}>{key.toUpperCase()}</div>
              <div style={{ ...s.spellName, color: def.color + 'bb' }}>{def.name}</div>

              {!ready && (
                <div style={s.cdNumBadge}>{cd.toFixed(1)}s</div>
              )}

              {ready && (
                <div style={{ ...s.readyDot, background: def.color }} />
              )}
            </div>
          )
        })}
      </div>

      {/* ── CONTROLS HINT ── */}
      <div style={s.hint}>
        WASD&nbsp;·&nbsp;SPACE jump&nbsp;·&nbsp;✊🖐✌ gestures&nbsp;·&nbsp;V voice&nbsp;·&nbsp;ESC exit
      </div>

      {/* ── WIN / LOSE OVERLAY ── */}
      {gameResult && (
        <div style={s.resultOverlay}>
          {/* decorative rune ring */}
          <div style={s.runeRing} />

          <div
            className={gameResult === 'win' ? 'victory-text' : 'defeat-text'}
            style={{ ...s.resultText, color: gameResult === 'win' ? '#44ff88' : '#ff4444' }}
          >
            {gameResult === 'win' ? '✦ VICTORY ✦' : '✦ DEFEATED ✦'}
          </div>

          {gameResult === 'win' && currentLevel < 3 ? (
            <>
              <div style={s.nextHint}>The next challenge awaits in the shadows…</div>
              <button className="duel-btn next-btn" onClick={onNextLevel}>
                ⚡ Face Level {currentLevel + 1} — {LEVEL_LABELS[currentLevel + 1]}
              </button>
              <button className="duel-btn" onClick={onExit}>Return to the Hall</button>
            </>
          ) : gameResult === 'win' && currentLevel === 3 ? (
            <>
              <div style={s.completeBadge}>✨ ALL DARK WIZARDS VANQUISHED ✨</div>
              <div style={s.nextHint}>You have mastered the art of magical combat.</div>
              <button className="duel-btn" onClick={onExit}>Return to the Hall</button>
            </>
          ) : (
            <>
              <div style={s.nextHint}>The Dark Arts cannot be conquered without sacrifice.</div>
              <button className="duel-btn" onClick={onExit}>Return to the Hall</button>
            </>
          )}
        </div>
      )}

    </div>
  )
}

/* ─── Styles ─────────────────────────────────────────────────── */
const s = {
  root: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 1000,
    fontFamily: "'Cinzel', 'Georgia', serif",
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px 18px',
  },
  topBar: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: 12,
    background: 'linear-gradient(180deg, rgba(5,5,15,0.92) 0%, rgba(5,5,15,0) 100%)',
    padding: '10px 16px 20px',
    animation: 'slideDown 0.4s ease',
  },
  hpPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  hpHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fighterTag: {
    fontSize: 10,
    color: '#c9a533',
    letterSpacing: 2.5,
    fontFamily: "'Cinzel', serif",
  },
  hpNum: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: "'Cinzel', serif",
    letterSpacing: 1,
  },
  hpTrack: {
    position: 'relative',
    height: 8,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.25s ease, background 0.3s',
  },
  hpTick: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: '100%',
    background: 'rgba(0,0,0,0.4)',
    zIndex: 2,
    pointerEvents: 'none',
  },
  centerCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
  },
  levelBadge: {
    fontSize: 9,
    fontFamily: "'Cinzel', serif",
    letterSpacing: 3,
    padding: '3px 10px',
    border: '1px solid',
    borderRadius: 1,
  },
  vsGlyph: {
    fontSize: 20,
    color: '#c9a533',
    lineHeight: 1,
    filter: 'drop-shadow(0 0 8px #c9a533)',
  },
  spellBar: {
    display: 'flex',
    gap: 12,
    marginBottom: 44,
    animation: 'slideDown 0.5s 0.1s both',
  },
  spellSlot: {
    position: 'relative',
    width: 76,
    padding: '10px 8px 8px',
    background: 'linear-gradient(180deg, rgba(10,10,20,0.92) 0%, rgba(5,5,12,0.98) 100%)',
    border: '1px solid',
    borderRadius: 3,
    textAlign: 'center',
    overflow: 'hidden',
    backdropFilter: 'blur(4px)',
    transition: 'opacity 0.2s',
  },
  cdSweep: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    background: 'rgba(0,0,0,0.6)',
    pointerEvents: 'none',
    transition: 'height 0.1s linear',
  },
  spellIcon: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: "'Cinzel Decorative', serif",
    letterSpacing: 0,
    lineHeight: 1,
  },
  spellName: {
    fontSize: 8,
    letterSpacing: 0.8,
    marginTop: 4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textTransform: 'uppercase',
  },
  cdNumBadge: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textShadow: '0 0 8px #000',
    fontFamily: "'Cinzel', serif",
  },
  readyDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    margin: '4px auto 0',
    boxShadow: '0 0 8px currentColor',
  },
  hint: {
    position: 'absolute',
    bottom: 14,
    fontSize: 10,
    color: 'rgba(201,165,51,0.4)',
    letterSpacing: 1.5,
    fontFamily: "'Cinzel', serif",
  },
  resultOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at center, rgba(5,5,20,0.88) 0%, rgba(0,0,0,0.75) 100%)',
    backdropFilter: 'blur(6px)',
    gap: 20,
    pointerEvents: 'auto',
    animation: 'fadeIn 0.6s ease',
  },
  runeRing: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: '50%',
    border: '1px solid rgba(201,165,51,0.18)',
    boxShadow: '0 0 60px rgba(201,165,51,0.06) inset',
    animation: 'auraRing 18s linear infinite',
    pointerEvents: 'none',
  },
  resultText: {
    fontSize: 52,
    fontWeight: '900',
    fontFamily: "'Cinzel Decorative', serif",
    letterSpacing: 8,
    zIndex: 1,
  },
  nextHint: {
    fontSize: 14,
    color: 'rgba(201,165,51,0.7)',
    letterSpacing: 1.5,
    fontFamily: "'Cinzel', serif",
    fontStyle: 'italic',
    zIndex: 1,
  },
  completeBadge: {
    fontSize: 18,
    fontFamily: "'Cinzel Decorative', serif",
    color: '#ffd700',
    letterSpacing: 3,
    textShadow: '0 0 30px #ffd700, 0 0 60px #ffd70044',
    zIndex: 1,
  },
}
