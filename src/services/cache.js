const CACHE_DB_NAME = "lexicon_cache";
const CACHE_DB_VERSION = 1;
const CACHE_STORE_NAME = "translations";
const MAX_CACHE_ENTRIES = 1000;
const CACHE_TTL_DAYS = 30;

let db = null;

const initCache = async () => {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open cache database"));
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(CACHE_STORE_NAME)) {
        const store = database.createObjectStore(CACHE_STORE_NAME, {
          keyPath: "key",
        });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("hitCount", "hitCount", { unique: false });
        store.createIndex("targetLanguage", "targetLanguage", {
          unique: false,
        });
      }
    };
  });
};

const generateCacheKey = (text, config) => {
  const key = `${text}||${config.targetLanguage || "Spanish"}||${config.model || "default"}||${config.protocol || "openai"}`;
  return btoa(key).substring(0, 100);
};

const isExpired = (entry) => {
  const now = Date.now();
  const entryAge = now - entry.timestamp;
  const maxAge = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
  return entryAge > maxAge;
};

const enforceCacheLimit = async (transaction) => {
  const store = transaction.objectStore(CACHE_STORE_NAME);
  const countRequest = store.count();

  return new Promise((resolve) => {
    countRequest.onsuccess = async () => {
      const count = countRequest.result;
      if (count <= MAX_CACHE_ENTRIES) {
        resolve();
        return;
      }

      const index = store.index("hitCount");
      const allKeysRequest = store.openKeyCursor(null, "prev");

      allKeysRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        const entriesToDelete = count - MAX_CACHE_ENTRIES;

        if (cursor && entriesToDelete > 0) {
          const deleteRequest = store.delete(cursor.primaryKey);
          deleteRequest.onsuccess = () => {
            store.count().onsuccess = (countEvent) => {
              if (countEvent.target.result > MAX_CACHE_ENTRIES) {
                enforceCacheLimit(transaction);
              } else {
                resolve();
              }
            };
          };
        } else {
          resolve();
        }
      };
    };
  });
};

const getCachedTranslation = async (text, config) => {
  try {
    if (!db) {
      await initCache();
    }

    const key = generateCacheKey(text, config);
    const transaction = db.transaction([CACHE_STORE_NAME], "readonly");
    const store = transaction.objectStore(CACHE_STORE_NAME);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const result = event.target.result;

        if (!result) {
          resolve({ cached: false, translation: null });
          return;
        }

        if (isExpired(result)) {
          const deleteTx = db.transaction([CACHE_STORE_NAME], "readwrite");
          deleteTx.objectStore(CACHE_STORE_NAME).delete(key);
          resolve({ cached: false, translation: null });
          return;
        }

        const updateTx = db.transaction([CACHE_STORE_NAME], "readwrite");
        const updateStore = updateTx.objectStore(CACHE_STORE_NAME);
        result.hitCount = (result.hitCount || 0) + 1;
        result.lastAccessed = Date.now();
        updateStore.put(result);

        resolve({ cached: true, translation: result.translation });
      };

      request.onerror = () => {
        reject(new Error("Failed to read from cache"));
      };
    });
  } catch (error) {
    console.error("Cache read error:", error);
    return { cached: false, translation: null };
  }
};

const setCachedTranslation = async (text, config, translation) => {
  try {
    if (!db) {
      await initCache();
    }

    const key = generateCacheKey(text, config);
    const transaction = db.transaction([CACHE_STORE_NAME], "readwrite");
    const store = transaction.objectStore(CACHE_STORE_NAME);

    await enforceCacheLimit(transaction);

    const entry = {
      key,
      text,
      translation,
      targetLanguage: config.targetLanguage || "Spanish",
      model: config.model || "default",
      protocol: config.protocol || "openai",
      timestamp: Date.now(),
      hitCount: 0,
      lastAccessed: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const request = store.put(entry);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to write to cache"));
      };
    });
  } catch (error) {
    console.error("Cache write error:", error);
  }
};

const clearExpiredCache = async () => {
  try {
    if (!db) {
      await initCache();
    }

    const now = Date.now();
    const maxAge = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
    const cutoffDate = now - maxAge;

    const transaction = db.transaction([CACHE_STORE_NAME], "readwrite");
    const store = transaction.objectStore(CACHE_STORE_NAME);
    const index = store.index("timestamp");
    const request = index.openCursor(IDBKeyRange.upperBound(cutoffDate));

    return new Promise((resolve) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  } catch (error) {
    console.error("Cache cleanup error:", error);
  }
};

const clearAllCache = async () => {
  try {
    if (!db) {
      await initCache();
    }

    const transaction = db.transaction([CACHE_STORE_NAME], "readwrite");
    const store = transaction.objectStore(CACHE_STORE_NAME);
    const request = store.clear();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to clear cache"));
    });
  } catch (error) {
    console.error("Cache clear error:", error);
  }
};

const getCacheStats = async () => {
  try {
    if (!db) {
      await initCache();
    }

    const transaction = db.transaction([CACHE_STORE_NAME], "readonly");
    const store = transaction.objectStore(CACHE_STORE_NAME);
    const countRequest = store.count();

    return new Promise((resolve) => {
      countRequest.onsuccess = (event) => {
        let totalHitCount = 0;
        let expiredCount = 0;
        const now = Date.now();
        const maxAge = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

        const allRequest = store.openCursor();

        allRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const entry = cursor.value;
            totalHitCount += entry.hitCount || 0;
            if (now - entry.timestamp > maxAge) {
              expiredCount++;
            }
            cursor.continue();
          } else {
            resolve({
              totalEntries: countRequest.result,
              totalHitCount,
              expiredCount,
              maxEntries: MAX_CACHE_ENTRIES,
              ttlDays: CACHE_TTL_DAYS,
            });
          }
        };
      };
      countRequest.onerror = () => resolve({ totalEntries: 0 });
    });
  } catch (error) {
    console.error("Cache stats error:", error);
    return { totalEntries: 0, totalHitCount: 0, expiredCount: 0 };
  }
};

export {
  initCache,
  getCachedTranslation,
  setCachedTranslation,
  clearExpiredCache,
  clearAllCache,
  getCacheStats,
  CACHE_TTL_DAYS,
  MAX_CACHE_ENTRIES,
};
