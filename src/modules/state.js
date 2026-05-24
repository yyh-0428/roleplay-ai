// ===== State Management =====
import { DEFAULT_CHARS, DEFAULT_STATUS } from './characters.js';

export const state = {
  conversations: [],
  currentConvId: null,
  characters: [...DEFAULT_CHARS],
  currentCharId: null,
  worldBook: [],
  globalMemory: '',
  globalCoreMemory: '',
  globalNotes: '',
  characterMemories: {},
  characterCoreMemories: {},
  characterNotes: {},
  settings: {
    provider: 'deepseek',
    apiKey: '',
    apiBase: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    temperature: 0.9,
    maxTokens: 2048,
    topP: 0.95,
    theme: 'light',
    fontSize: 0.88,
    narrativeMode: false,
    oocMode: false
  },
  statusDataMap: {},
  needsStatusReminder: false,
  apiProfiles: [],
  currentProfileId: null,
  streaming: false,
  abortController: null
};

export function getStatusData() {
  const charId = state.currentCharId;
  if (!charId) return { world: [], character: [], inventory: [], custom: [] };
  if (!state.statusDataMap[charId]) {
    const char = state.characters.find(c => c.id === charId);
    state.statusDataMap[charId] = JSON.parse(JSON.stringify(char?.defaultStatusData || { world: [], character: [], inventory: [], custom: [] }));
  }
  return state.statusDataMap[charId];
}
