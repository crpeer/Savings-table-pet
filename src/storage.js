const STORAGE_KEY = "savings-table-pet-state-v1";

export const localStorageAdapter = {
  async load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  },

  async save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  async exportState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw || "{}";
  },

  async importState(json) {
    const parsed = JSON.parse(json);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return parsed;
  },
};

export const customSyncAdapter = {
  async load() {
    throw new Error("请在 src/storage.js 中实现自定义同步 load()");
  },
  async save(_state) {
    throw new Error("请在 src/storage.js 中实现自定义同步 save(state)");
  },
  async exportState() {
    throw new Error("请在 src/storage.js 中实现自定义同步 exportState()");
  },
  async importState(_json) {
    throw new Error("请在 src/storage.js 中实现自定义同步 importState(json)");
  },
};
