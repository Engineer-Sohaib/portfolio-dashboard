export class StorageQuotaError extends Error {
  constructor(key) {
    super(`Storage quota exceeded while writing "${key}"`);
    this.name = 'StorageQuotaError';
    this.key = key;
  }
}

const DB_NAME = 'pa_admin_store';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

export class StorageService {
  /**
   * @param {object} [opts]
   * @param {boolean} [opts.preferIndexedDB=true]
   */
  constructor(opts = {}) {
    this.preferIndexedDB = opts.preferIndexedDB !== false;
    this.backend = 'localStorage'; 
    this._cache = new Map();
    this._db = null;
    this._readyPromise = this._init();
  }

  ready() {
    return this._readyPromise;
  }

  async _init() {
    if (!this.preferIndexedDB || typeof indexedDB === 'undefined') return;
    try {
      this._db = await this._openIndexedDB();
      this.backend = 'indexeddb';
    } catch (err) {
      console.warn('[StorageService] IndexedDB unavailable, falling back to localStorage:', err);
      this._db = null;
      this.backend = 'localStorage';
    }
  }

  _openIndexedDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('IndexedDB open blocked'));
    });
  }

  /**
   * Read and JSON-parse a value.
   * @param {string} key
   * @param {*} [fallback] value returned when the key is missing or unparsable
   */
  async get(key, fallback = null) {
    if (this._cache.has(key)) return this._cache.get(key);
    await this._readyPromise;
    try {
      const raw = this.backend === 'indexeddb' ? await this._idbGet(key) : this._lsGet(key);
      if (raw === undefined || raw === null) return fallback;
      const value = this.backend === 'indexeddb' ? raw : JSON.parse(raw);
      this._cache.set(key, value);
      return value;
    } catch (err) {
      console.warn(`[StorageService] get("${key}") failed, using fallback:`, err);
      return fallback;
    }
  }

  /**
   * JSON-stringify and persist a value.
   * @param {string} key
   * @param {*} value
   * @throws {StorageQuotaError}
   */
  async set(key, value) {
    await this._readyPromise;
    this._cache.set(key, value);
    try {
      if (this.backend === 'indexeddb') {
        await this._idbSet(key, value);
      } else {
        this._lsSet(key, JSON.stringify(value));
      }
    } catch (err) {
      if (this._isQuotaError(err)) throw new StorageQuotaError(key);
      throw err;
    }
  }

  async remove(key) {
    await this._readyPromise;
    this._cache.delete(key);
    if (this.backend === 'indexeddb') {
      await this._idbDelete(key);
    } else {
      localStorage.removeItem(key);
    }
  }

  async getMany(keys, fallback = null) {
    const out = {};
    await Promise.all(keys.map(async (k) => { out[k] = await this.get(k, fallback); }));
    return out;
  }

  async setMany(entries) {
    await this._readyPromise;
    if (this.backend === 'indexeddb') {
      const tx = this._db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const [key, value] of Object.entries(entries)) {
        this._cache.set(key, value);
        store.put(value, key);
      }
      await this._txDone(tx);
      return;
    }
    for (const [key, value] of Object.entries(entries)) {
      await this.set(key, value);
    }
  }

  _lsGet(key) {
    return localStorage.getItem(key);
  }

  _lsSet(key, raw) {
    localStorage.setItem(key, raw);
  }

  _idbGet(key) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  _idbSet(key, value) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
    });
  }

  _idbDelete(key) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  _txDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
    });
  }

  _isQuotaError(err) {
    return (
      err &&
      (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22 ||
        err.code === 1014)
    );
  }
}

export const storage = new StorageService();
