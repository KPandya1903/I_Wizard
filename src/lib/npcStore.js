// Shared mutable store for NPC group-based runtime state

// Per-NPC live position, written by NPCCharacter each frame
export const npcPositions = {} // { [npcKey]: { x, z } }

// Per-NPC speech bubble, written by conversation manager
export const npcSpeech = {} // { [npcKey]: { text, expires } }

// Group conversation state — keyed by group ID
// Populated at init by NPCConversationManager
export const groupConvoState = {}
// Each entry: { active, speaking, history: [{ name, npcKey, text }], cooldownUntil }

// NPC-to-group assignment at runtime (mutable, changes on migration)
export const npcGroupAssignment = {} // { [npcKey]: groupId }

// Player state for voice interaction
export const playerState = {
  nearGroup: null,       // group key or null
  isListening: false,    // true while recording
  lastTranscript: null,  // most recent player speech text
}
