import { useState } from 'react'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Cinzel+Decorative:wght@700&display=swap');

  @keyframes lp-float {
    0%,100% { transform: translate(-50%, -50%) scale(1);   opacity: 0.55; }
    50%      { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
  }
  @keyframes lp-orb2 {
    0%,100% { transform: translate(0,0) scale(1); opacity: 0.3; }
    33%     { transform: translate(-20px, -30px) scale(1.15); opacity: 0.5; }
    66%     { transform: translate(20px, 10px) scale(0.9); opacity: 0.35; }
  }
  @keyframes lp-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes lp-fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lp-scanline {
    0%   { top: -4px; }
    100% { top: 100%; }
  }
  @keyframes lp-border-glow {
    0%,100% { box-shadow: 0 0 0 rgba(201,165,51,0); }
    50%     { box-shadow: 0 0 20px rgba(201,165,51,0.35), 0 0 40px rgba(201,165,51,0.12); }
  }
  @keyframes lp-crest-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .lp-root {
    position: fixed; inset: 0;
    background: radial-gradient(ellipse at 50% 30%, #14082a 0%, #0a0514 50%, #050208 100%);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    font-family: 'Cinzel', 'Georgia', serif;
    overflow: hidden;
  }

  /* Ambient orbs */
  .lp-orb1 {
    position: absolute; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(120,40,200,0.22) 0%, transparent 70%);
    top: 40%; left: 50%;
    transform: translate(-50%,-50%);
    animation: lp-float 8s ease-in-out infinite;
    pointer-events: none;
  }
  .lp-orb2 {
    position: absolute; width: 300px; height: 300px; border-radius: 50%;
    background: radial-gradient(circle, rgba(201,165,51,0.18) 0%, transparent 70%);
    top: 20%; right: 10%;
    animation: lp-orb2 12s ease-in-out infinite;
    pointer-events: none;
  }
  .lp-orb3 {
    position: absolute; width: 240px; height: 240px; border-radius: 50%;
    background: radial-gradient(circle, rgba(60,120,220,0.15) 0%, transparent 70%);
    bottom: 20%; left: 8%;
    animation: lp-orb2 10s 2s ease-in-out infinite reverse;
    pointer-events: none;
  }

  /* Stars */
  .lp-stars {
    position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(1.5px 1.5px at 15% 25%, rgba(201,165,51,0.7) 0%, transparent 100%),
      radial-gradient(1px   1px   at 35% 65%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 60% 15%, rgba(201,165,51,0.6) 0%, transparent 100%),
      radial-gradient(1px   1px   at 80% 45%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(1px   1px   at 10% 80%, rgba(201,165,51,0.5) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 90% 10%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(1px   1px   at 50% 90%, rgba(201,165,51,0.4) 0%, transparent 100%),
      radial-gradient(1px   1px   at 72% 70%, rgba(255,255,255,0.35) 0%, transparent 100%),
      radial-gradient(1px   1px   at 25% 50%, rgba(201,165,51,0.3) 0%, transparent 100%),
      radial-gradient(1px   1px   at 88% 80%, rgba(255,255,255,0.3) 0%, transparent 100%);
  }

  /* Crest ring */
  .lp-crest-ring {
    position: relative; width: 180px; height: 180px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
    animation: lp-fadeUp 0.8s ease both;
  }
  .lp-crest-ring::before {
    content: '';
    position: absolute; inset: 0; border-radius: 50%;
    border: 1px solid rgba(201,165,51,0.35);
    box-shadow: 0 0 30px rgba(201,165,51,0.1) inset, 0 0 60px rgba(120,40,200,0.1);
    animation: lp-crest-spin 30s linear infinite;
  }
  .lp-crest-ring::after {
    content: '';
    position: absolute; inset: 12px; border-radius: 50%;
    border: 1px dashed rgba(201,165,51,0.18);
  }

  .lp-crest-symbol {
    font-size: 72px; line-height: 1;
    filter: drop-shadow(0 0 20px rgba(201,165,51,0.8)) drop-shadow(0 0 40px rgba(120,40,200,0.5));
  }

  /* Title */
  .lp-title {
    font-family: 'Cinzel Decorative', serif;
    font-size: 62px; font-weight: 700;
    background: linear-gradient(135deg, #f0d060 0%, #c9a533 40%, #e8c060 60%, #a07828 100%);
    background-size: 200% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: lp-fadeUp 0.8s 0.1s ease both, lp-shimmer 5s linear infinite;
    letter-spacing: 8px; text-align: center;
    margin-bottom: 6px;
  }
  .lp-divider {
    display: flex; align-items: center; gap: 14px;
    margin: 12px 0 28px;
    animation: lp-fadeUp 0.8s 0.2s ease both;
  }
  .lp-divider-line {
    width: 80px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(201,165,51,0.5));
  }
  .lp-divider-line.right {
    background: linear-gradient(90deg, rgba(201,165,51,0.5), transparent);
  }
  .lp-divider-gem { font-size: 14px; color: #c9a533; }

  .lp-subtitle {
    font-size: 12px; letter-spacing: 5px; text-align: center;
    color: rgba(232,220,200,0.55);
    animation: lp-fadeUp 0.8s 0.2s ease both;
  }

  /* Form */
  .lp-form {
    display: flex; flex-direction: column; align-items: center; gap: 14px;
    animation: lp-fadeUp 0.8s 0.3s ease both; z-index: 1;
  }
  .lp-label {
    font-size: 10px; letter-spacing: 4px; color: rgba(201,165,51,0.7);
    text-transform: uppercase;
  }

  .lp-input-wrap { position: relative; }

  .lp-input {
    width: 300px; padding: 14px 22px;
    background: rgba(10,5,24,0.85);
    border: 1px solid rgba(201,165,51,0.5);
    border-radius: 2px;
    color: #e8dcc8; font-size: 17px;
    font-family: 'Cinzel', serif; text-align: center;
    outline: none; letter-spacing: 2px;
    transition: border-color 0.3s, box-shadow 0.3s;
    animation: lp-border-glow 3s ease-in-out infinite;
    caret-color: #c9a533;
  }
  .lp-input:focus {
    border-color: rgba(201,165,51,0.9);
    box-shadow: 0 0 0 1px rgba(201,165,51,0.3), 0 0 24px rgba(201,165,51,0.2);
    animation: none;
  }
  .lp-input::placeholder { color: rgba(201,165,51,0.3); letter-spacing: 2px; }

  .lp-btn-primary {
    position: relative; overflow: hidden;
    padding: 15px 60px;
    background: linear-gradient(135deg, #c9a533 0%, #a07828 50%, #c9a533 100%);
    background-size: 200% auto;
    border: none; border-radius: 2px;
    color: #0a0514; font-size: 14px; font-weight: 900;
    font-family: 'Cinzel', serif; letter-spacing: 5px;
    cursor: pointer;
    transition: background-position 0.4s, box-shadow 0.3s, letter-spacing 0.2s, opacity 0.2s;
    box-shadow: 0 4px 24px rgba(201,165,51,0.25), 0 0 0 1px rgba(255,220,80,0.2);
  }
  .lp-btn-primary::after {
    content: '';
    position: absolute; top: -4px; left: -100%;
    width: 60px; height: calc(100% + 8px);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
    transform: skewX(-20deg);
    transition: left 0.5s;
  }
  .lp-btn-primary:hover::after { left: 140%; }
  .lp-btn-primary:hover {
    background-position: right center;
    box-shadow: 0 6px 36px rgba(201,165,51,0.45), 0 0 0 1px rgba(255,220,80,0.4);
    letter-spacing: 6px;
  }

  .lp-btn-secondary {
    padding: 11px 40px;
    background: transparent;
    border: 1px solid rgba(201,165,51,0.3);
    border-radius: 2px;
    color: rgba(201,165,51,0.65); font-size: 11px;
    font-family: 'Cinzel', serif; letter-spacing: 4px;
    cursor: pointer;
    transition: border-color 0.3s, color 0.3s, box-shadow 0.3s;
  }
  .lp-btn-secondary:hover {
    border-color: rgba(201,165,51,0.7);
    color: rgba(201,165,51,1);
    box-shadow: 0 0 20px rgba(201,165,51,0.15);
  }

  .lp-footer {
    position: absolute; bottom: 28px;
    font-size: 10px; letter-spacing: 3px;
    color: rgba(201,165,51,0.25);
  }
`

export default function LandingPage({ onContinue, onPlayOnline }) {
  const [name, setName] = useState('')
  const active = name.trim().length > 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (active) onContinue(name.trim())
  }

  return (
    <div className="lp-root">
      <style>{CSS}</style>

      {/* Ambient */}
      <div className="lp-stars" />
      <div className="lp-orb1" />
      <div className="lp-orb2" />
      <div className="lp-orb3" />

      {/* Crest */}
      <div className="lp-crest-ring">
        <span className="lp-crest-symbol">⚯</span>
      </div>

      <div className="lp-title">HOGWARTS</div>

      <div className="lp-divider">
        <div className="lp-divider-line" />
        <span className="lp-divider-gem">✦</span>
        <div className="lp-divider-line right" />
      </div>

      <div className="lp-subtitle">THE GREAT HALL EXPERIENCE</div>

      <form className="lp-form" onSubmit={handleSubmit} style={{ marginTop: 32 }}>
        <div className="lp-label">Enter Your Wizard Name</div>

        <div className="lp-input-wrap">
          <input
            className="lp-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name…"
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="lp-btn-primary"
          style={{ opacity: active ? 1 : 0.4, pointerEvents: active ? 'auto' : 'none' }}
        >
          ENTER
        </button>

        <button
          type="button"
          className="lp-btn-secondary"
          style={{ opacity: active ? 1 : 0.35, pointerEvents: active ? 'auto' : 'none' }}
          onClick={() => active && onPlayOnline(name.trim())}
        >
          ⚡ PLAY ONLINE
        </button>
      </form>

      <div className="lp-footer">A Hogwarts Interactive Experience</div>
    </div>
  )
}
