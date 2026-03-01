export const LEVEL_CONFIGS = {
  1: {
    label: 'The Apprentice',
    opponentMaxHP: 100,
    heightScale: 1.0,
    damageMult: 1.0,
    incomingDamageMult: 1.0,
    aiSpeed: 4,
    aiAttackMin: 4,
    aiAttackMax: 7,
    taunts: [
      "Is that all you've got?",
      "You call that a spell?",
      "My grandmother casts better than you!",
      "Pathetic. Simply pathetic.",
    ],
  },
  2: {
    label: 'The Dark Wizard',
    opponentMaxHP: 150,
    heightScale: 2.0,
    damageMult: 1.35,
    incomingDamageMult: 1.2,
    aiSpeed: 5.5,
    aiAttackMin: 2.5,
    aiAttackMax: 5,
    taunts: [
      "You cannot defeat the darkness!",
      "Your skills are laughable.",
      "I have faced better wizards in my sleep.",
      "Surrender now and spare yourself the humiliation.",
    ],
  },
  3: {
    label: 'The Dark Lord',
    opponentMaxHP: 200,
    heightScale: 2.0,
    damageMult: 1.8,
    incomingDamageMult: 1.5,
    aiSpeed: 7,
    aiAttackMin: 1.5,
    aiAttackMax: 3.5,
    taunts: [
      "There is no light that can touch me!",
      "You dare challenge the Dark Lord?",
      "Your defeat was written before you were born.",
      "Even death fears me. Do you not?",
      "I am inevitable. You are nothing.",
    ],
  },
}

export const duelState = {
  playerHP: 100,
  opponentHP: 100,
  opponentMaxHP: 100,
  currentLevel: 1,
  gameResult: null,    // null | 'win' | 'lose'
  cooldowns: { q: 0, e: 0, r: 0, f: 0 },
  maxCooldowns: { q: 1.5, e: 1.0, r: 5.0, f: 8.0 },
}
