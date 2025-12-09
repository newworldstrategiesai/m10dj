/**
 * Bulletproof questionnaire storage with multiple layers of redundancy
 * Uses IndexedDB (primary), localStorage (backup), and in-memory cache
 */

class QuestionnaireStorage {
  constructor(leadId) {
    this.leadId = leadId;
    this.dbName = 'QuestionnaireDB';
    this.storeName = 'questionnaires';
    this.db = null;
    this.memoryCache = null;
    this.version = 1;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.warn('IndexedDB not available, falling back to localStorage');
        resolve(false);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'leadId' });
        }
      };
    });
  }

  // Save to all storage layers
  async save(data) {
    const saveData = {
      leadId: this.leadId,
      data: data,
      timestamp: Date.now(),
      version: this.version,
      checksum: this.calculateChecksum(data)
    };

    const results = {
      indexedDB: false,
      localStorage: false,
      memory: false
    };

    // 1. Save to IndexedDB (primary)
    if (this.db) {
      try {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        await new Promise((resolve, reject) => {
          const request = store.put(saveData);
          request.onsuccess = () => {
            results.indexedDB = true;
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.warn('IndexedDB save failed:', error);
      }
    }

    // 2. Save to localStorage (backup)
    try {
      localStorage.setItem(`questionnaire_${this.leadId}`, JSON.stringify(saveData));
      results.localStorage = true;
    } catch (error) {
      console.warn('localStorage save failed:', error);
    }

    // 3. Save to memory cache (fastest)
    this.memoryCache = saveData;
    results.memory = true;

    return results;
  }

  // Load from all storage layers (prioritize most recent)
  async load() {
    const sources = [];

    // 1. Try memory cache first (fastest)
    if (this.memoryCache && this.memoryCache.leadId === this.leadId) {
      sources.push({
        source: 'memory',
        data: this.memoryCache,
        timestamp: this.memoryCache.timestamp
      });
    }

    // 2. Try IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const data = await new Promise((resolve, reject) => {
          const request = store.get(this.leadId);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        if (data) {
          sources.push({
            source: 'indexedDB',
            data: data,
            timestamp: data.timestamp
          });
        }
      } catch (error) {
        console.warn('IndexedDB load failed:', error);
      }
    }

    // 3. Try localStorage
    try {
      const stored = localStorage.getItem(`questionnaire_${this.leadId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        sources.push({
          source: 'localStorage',
          data: parsed,
          timestamp: parsed.timestamp || 0
        });
      }
    } catch (error) {
      console.warn('localStorage load failed:', error);
    }

    // Return most recent data
    if (sources.length === 0) return null;

    sources.sort((a, b) => b.timestamp - a.timestamp);
    const latest = sources[0].data;

    // Verify checksum
    if (latest.checksum && latest.data) {
      const calculatedChecksum = this.calculateChecksum(latest.data);
      if (calculatedChecksum !== latest.checksum) {
        console.warn('Data checksum mismatch, data may be corrupted');
        // Try next source
        if (sources.length > 1) {
          return sources[1].data.data;
        }
      }
    }

    return latest.data;
  }

  // Calculate simple checksum for data integrity
  calculateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  // Clear all storage
  async clear() {
    // Clear IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        await new Promise((resolve, reject) => {
          const request = store.delete(this.leadId);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.warn('IndexedDB clear failed:', error);
      }
    }

    // Clear localStorage
    try {
      localStorage.removeItem(`questionnaire_${this.leadId}`);
    } catch (error) {
      console.warn('localStorage clear failed:', error);
    }

    // Clear memory
    this.memoryCache = null;
  }

  // Get storage status
  getStatus() {
    return {
      indexedDB: !!this.db,
      localStorage: typeof Storage !== 'undefined',
      memory: !!this.memoryCache,
      leadId: this.leadId
    };
  }
}

export default QuestionnaireStorage;



