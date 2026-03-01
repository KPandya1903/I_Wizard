import { GENERATED_CHARACTERS, GENERATED_NPC_PLACEMENTS } from './generatedCharacters'

// Manual overrides for specific characters (merged on top of generated defaults)
const OVERRIDES = {
  aj: {
    displayName: 'Aj',
    height: 1.8,
  },
  villian: {
    displayName: 'Villain',
    height: 2.8,
  },
}

// Deep merge: override fields take priority, but keep generated fields that aren't overridden
function deepMerge(base, override) {
  const result = { ...base }
  for (const [key, val] of Object.entries(override)) {
    if (val && typeof val === 'object' && !Array.isArray(val) && typeof result[key] === 'object') {
      result[key] = { ...result[key], ...val }
    } else {
      result[key] = val
    }
  }
  return result
}

// Build merged CHARACTER_CONFIGS
const merged = { ...GENERATED_CHARACTERS }

// Apply overrides for generated characters
for (const [key, overrideData] of Object.entries(OVERRIDES)) {
  if (merged[key]) {
    merged[key] = deepMerge(merged[key], overrideData)
  }
}

export const CHARACTER_CONFIGS = merged

export const NPC_PLACEMENTS = { ...GENERATED_NPC_PLACEMENTS }
