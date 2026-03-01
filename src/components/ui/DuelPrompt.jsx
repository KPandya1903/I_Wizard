import { CHARACTER_CONFIGS } from '../../data/characterConfigs'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap');

  @keyframes dp-rise {
    from { opacity: 0; transform: translate(-50%, 12px); }
    to   { opacity: 1; transform: translate(-50%, 0); }
  }
  @keyframes dp-glow {
    0%,100% { box-shadow: 0 0 12px rgba(201,165,51,0.2); }
    50%     { box-shadow: 0 0 24px rgba(201,165,51,0.45), 0 0 48px rgba(201,165,51,0.12); }
  }
  @keyframes dp-pulse-red {
    0%,100% { box-shadow: 0 0 12px rgba(200,60,60,0.3); border-color: rgba(200,60,60,0.7); }
    50%     { box-shadow: 0 0 28px rgba(200,60,60,0.6), 0 0 56px rgba(200,60,60,0.15); }
  }

  .dp-wrap {
    position: fixed;
    bottom: 28px; left: 50%;
    transform: translateX(-50%);
    z-index: 1000; pointer-events: none;
    animation: dp-rise 0.35s ease both;
  }

  .dp-pill {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 22px;
    background: linear-gradient(135deg, rgba(10,5,24,0.95), rgba(6,3,14,0.98));
    border: 1px solid rgba(201,165,51,0.5);
    border-radius: 2px;
    backdrop-filter: blur(8px);
    white-space: nowrap;
    font-family: 'Cinzel', 'Georgia', serif;
    animation: dp-glow 2.5s ease-in-out infinite;
  }

  .dp-pill.challenged {
    border-color: rgba(200,60,60,0.6);
    animation: dp-pulse-red 1.2s ease-in-out infinite;
  }

  .dp-icon { font-size: 14px; }

  .dp-text {
    font-size: 12px; letter-spacing: 2.5px;
    color: rgba(201,165,51,0.9);
    text-transform: uppercase;
  }

  .dp-pill.challenged .dp-text { color: rgba(255,120,100,0.95); }

  .dp-key {
    font-size: 10px; letter-spacing: 1px;
    color: rgba(201,165,51,0.5);
    padding: 2px 8px;
    border: 1px solid rgba(201,165,51,0.25);
    border-radius: 2px;
  }
`

export default function DuelPrompt({ npcKey, isChallenged }) {
  const config = CHARACTER_CONFIGS[npcKey]
  if (!config) return null

  const name = config.displayName

  return (
    <div className="dp-wrap">
      <style>{CSS}</style>
      <div className={`dp-pill${isChallenged ? ' challenged' : ''}`}>
        <span className="dp-icon">{isChallenged ? '⚔' : '🗣'}</span>
        <span className="dp-text">
          {isChallenged
            ? `${name} prepares to duel…`
            : `Challenge ${name} to a duel`}
        </span>
        {!isChallenged && <span className="dp-key">Hold V</span>}
      </div>
    </div>
  )
}
