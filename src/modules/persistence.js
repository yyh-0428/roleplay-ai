// ===== Persistence (now uses IndexedDB via storage.js) =====
import { state } from './state.js';
import { idbSave, idbLoad, idbHasData, migrateFromLocalStorage } from './storage.js';

let _saveTimer = null;

export async function saveState() {
  // Debounced save to avoid excessive writes
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    try {
      await idbSave('roleplay-ai-state', {
        conversations: state.conversations,
        characters: state.characters,
        worldBook: state.worldBook,
        statusDataMap: state.statusDataMap,
        globalMemory: state.globalMemory,
        globalCoreMemory: state.globalCoreMemory,
        globalNotes: state.globalNotes,
        characterMemories: state.characterMemories,
        characterCoreMemories: state.characterCoreMemories,
        characterNotes: state.characterNotes,
        settings: state.settings,
        currentCharId: state.currentCharId,
        apiProfiles: state.apiProfiles,
        currentProfileId: state.currentProfileId
      });
    } catch (e) {
      console.error('Save failed:', e);
    }
  }, 100);
}

// Force immediate save (for critical operations)
export async function saveStateNow() {
  if (_saveTimer) clearTimeout(_saveTimer);
  try {
    await idbSave('roleplay-ai-state', {
      conversations: state.conversations,
      characters: state.characters,
      worldBook: state.worldBook,
      statusDataMap: state.statusDataMap,
      globalMemory: state.globalMemory,
      globalCoreMemory: state.globalCoreMemory,
      globalNotes: state.globalNotes,
      characterMemories: state.characterMemories,
      characterCoreMemories: state.characterCoreMemories,
      characterNotes: state.characterNotes,
      settings: state.settings,
      currentCharId: state.currentCharId,
      apiProfiles: state.apiProfiles,
      currentProfileId: state.currentProfileId
    });
  } catch (e) {
    console.error('Save failed:', e);
  }
}

export async function loadState() {
  try {
    // First check if IndexedDB has data
    const hasIdbData = await idbHasData();
    let data = null;

    if (!hasIdbData) {
      // Try migrating from localStorage
      data = await migrateFromLocalStorage();
    }

    if (!data) {
      data = await idbLoad('roleplay-ai-state');
    }

    if (data) {
      // Migration: old flat statusData to statusDataMap
      if (data.statusData && !data.statusDataMap) {
        data.statusDataMap = { [data.currentCharId || 'unknown']: data.statusData };
        delete data.statusData;
      }
      // Migration: old flat memory to tiered format
      if (data.globalMemory && !data.globalCoreMemory) {
        data.globalCoreMemory = data.globalMemory;
        data.globalNotes = '';
      }
      if (data.characterMemories && !data.characterCoreMemories) {
        data.characterCoreMemories = {};
        data.characterNotes = {};
        for (const [k, v] of Object.entries(data.characterMemories)) {
          data.characterCoreMemories[k] = v;
          data.characterNotes[k] = '';
        }
      }
      Object.assign(state, data);
    }
  } catch (e) {
    console.error('Load failed:', e);
  }
}
