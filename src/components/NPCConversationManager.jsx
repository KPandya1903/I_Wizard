import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { npcSpeech, groupConvoState, npcGroupAssignment, playerState } from '../lib/npcStore'
import { NPC_GROUPS, MIGRATION_INTERVAL } from '../data/groupConfig'
import { CHARACTER_CONFIGS } from '../data/characterConfigs'
import { chat } from '../lib/featherless'
import { speak } from '../lib/speak'

const SPEECH_DURATION = 6000
const ROUND_PAUSE = 4000
const PLAYER_RESPONSE_PAUSE = 1500

const activeLoops = {}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function getMembersOfGroup(groupId) {
  return Object.entries(npcGroupAssignment)
    .filter(([, gId]) => gId === groupId)
    .map(([npcKey]) => npcKey)
}

// --- Group auto-conversation loop ---
async function groupConversationLoop(groupId) {
  if (activeLoops[groupId]) return
  activeLoops[groupId] = true

  const state = groupConvoState[groupId]
  if (!state) return

  while (activeLoops[groupId]) {
    const members = getMembersOfGroup(groupId)
    if (members.length < 2) {
      await delay(5000)
      continue
    }

    // Player is nearby — pause NPC auto-chat, only respond to player speech
    if (playerState.nearGroup === groupId) {
      if (playerState.lastTranscript) {
        await handlePlayerInput(groupId)
      } else {
        await delay(300)
      }
      continue
    }

    // Player not nearby — run silent NPC-to-NPC auto-conversation (no TTS)
    state.active = true
    const recentHistory = state.history.slice(-10)

    for (const npcKey of members) {
      if (!activeLoops[groupId]) break
      if (playerState.nearGroup === groupId) break // player arrived mid-round

      const config = CHARACTER_CONFIGS[npcKey]
      if (!config) continue

      const otherNames = members
        .filter(k => k !== npcKey)
        .map(k => CHARACTER_CONFIGS[k]?.displayName)
        .join(', ')

      const systemMsg = {
        role: 'system',
        content: `${config.systemPrompt} You are in a group conversation in the Great Hall at Hogwarts with ${otherNames}. Keep your response to 1 short sentence. Be natural and conversational.`,
      }

      const contextMsg = recentHistory.length > 0
        ? {
            role: 'user',
            content: `The conversation so far:\n${recentHistory.map(h => `${h.name}: "${h.text}"`).join('\n')}\n\nNow it's your turn. Say something.`,
          }
        : {
            role: 'user',
            content: `You're standing with ${otherNames}. Start a casual conversation.`,
          }

      try {
        const line = await chat([systemMsg, contextMsg])
        if (!activeLoops[groupId]) break

        npcSpeech[npcKey] = { text: line, expires: Date.now() + SPEECH_DURATION }
        state.speaking = npcKey
        state.history.push({ name: config.displayName, npcKey, text: line })

        if (state.history.length > 20) {
          state.history = state.history.slice(-15)
        }

        await delay(SPEECH_DURATION)

        npcSpeech[npcKey] = { text: '', expires: 0 }
        state.speaking = null
        await delay(800)
      } catch (err) {
        console.warn(`Group ${groupId} convo error for ${npcKey}:`, err.message)
        await delay(2000)
      }
    }

    state.active = false
    await delay(ROUND_PAUSE)
  }
}

// --- Handle player speech in a group ---
async function handlePlayerInput(groupId) {
  const transcript = playerState.lastTranscript
  playerState.lastTranscript = null

  const state = groupConvoState[groupId]
  if (!state) return
  const members = getMembersOfGroup(groupId)

  state.history.push({ name: 'Player', npcKey: 'player', text: transcript })

  for (const npcKey of members) {
    if (playerState.nearGroup !== groupId) break // player walked away

    const config = CHARACTER_CONFIGS[npcKey]
    if (!config) continue

    const recentHistory = state.history.slice(-10)
    const systemMsg = {
      role: 'system',
      content: `${config.systemPrompt} A player has joined your group conversation in the Great Hall. Respond to what they just said. Keep your response to 1-2 short sentences.`,
    }
    const contextMsg = {
      role: 'user',
      content: `Recent conversation:\n${recentHistory.map(h => `${h.name}: "${h.text}"`).join('\n')}\n\nThe player just said: "${transcript}". Respond directly to them.`,
    }

    try {
      const line = await chat([systemMsg, contextMsg])
      npcSpeech[npcKey] = { text: line, expires: Date.now() + SPEECH_DURATION }
      state.speaking = npcKey
      state.history.push({ name: config.displayName, npcKey, text: line })

      await speak(line, npcKey)
      npcSpeech[npcKey] = { text: '', expires: 0 }
      state.speaking = null

      await delay(PLAYER_RESPONSE_PAUSE)
    } catch (err) {
      console.warn(`NPC ${npcKey} response error:`, err.message)
    }
  }
}

// --- Migration logic ---
let lastMigrationTime = Date.now()

function tryMigration() {
  if (Date.now() - lastMigrationTime < MIGRATION_INTERVAL) return
  lastMigrationTime = Date.now()

  const groupIds = Object.keys(NPC_GROUPS)
  const allNPCs = Object.keys(npcGroupAssignment)

  // Only migrate from groups with 3+ members (keep min 2)
  const candidates = allNPCs.filter(k => {
    const gId = npcGroupAssignment[k]
    const members = getMembersOfGroup(gId)
    return members.length >= 3 && groupConvoState[gId]?.speaking !== k
  })

  if (candidates.length === 0) return

  const npc = candidates[Math.floor(Math.random() * candidates.length)]
  const currentGroup = npcGroupAssignment[npc]
  const otherGroups = groupIds.filter(g => g !== currentGroup)
  const targetGroup = otherGroups[Math.floor(Math.random() * otherGroups.length)]

  npcGroupAssignment[npc] = targetGroup
  // NPCCharacter detects this in useFrame and starts walking to new group
}

export default function NPCConversationManager({ excludeCharacter }) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Initialize group assignments from config, excluding player's character
    for (const [groupId, groupDef] of Object.entries(NPC_GROUPS)) {
      for (const npcKey of groupDef.members) {
        if (npcKey !== excludeCharacter) {
          npcGroupAssignment[npcKey] = groupId
        }
      }
      groupConvoState[groupId] = {
        active: false,
        speaking: null,
        history: [],
        cooldownUntil: 0,
      }
    }

    // If excluding player left a group with only 1 member, merge into nearest group
    for (const [groupId] of Object.entries(NPC_GROUPS)) {
      const members = getMembersOfGroup(groupId)
      if (members.length === 1) {
        const loneNPC = members[0]
        const otherGroups = Object.keys(NPC_GROUPS).filter(g => g !== groupId)
        if (otherGroups.length > 0) {
          npcGroupAssignment[loneNPC] = otherGroups[0]
        }
      }
    }

    // Start conversation loops with staggered delays
    const groupIds = Object.keys(NPC_GROUPS)
    groupIds.forEach((gId, i) => {
      setTimeout(() => groupConversationLoop(gId), 3000 + i * 5000)
    })

    return () => {
      for (const gId of Object.keys(activeLoops)) {
        activeLoops[gId] = false
      }
    }
  }, [excludeCharacter])

  useFrame(() => {
    tryMigration()
  })

  return null
}
