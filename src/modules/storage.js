// ===== IndexedDB Storage Layer =====

const DB_NAME = 'huanjing-db';
const DB_VERSION = 1;
const STORE_NAME = 'appState';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSave(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbLoad(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbRemove(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Check if IndexedDB has stored data
export async function idbHasData() {
  const data = await idbLoad('roleplay-ai-state');
  return data != null;
}

// Migrate data from localStorage to IndexedDB
export async function migrateFromLocalStorage() {
  try {
    const saved = localStorage.getItem('roleplay-ai-state');
    if (saved) {
      const data = JSON.parse(saved);
      await idbSave('roleplay-ai-state', data);
      localStorage.removeItem('roleplay-ai-state');
      return data;
    }
  } catch (e) {
    console.error('Migration from localStorage failed:', e);
  }
  return null;
}
