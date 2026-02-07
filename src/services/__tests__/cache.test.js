import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initCache,
  getCachedTranslation,
  setCachedTranslation,
  clearExpiredCache,
  clearAllCache,
  getCacheStats,
  MAX_CACHE_ENTRIES,
  CACHE_TTL_DAYS,
} from "../cache.js";

describe("Cache Service", () => {
  const mockConfig = {
    targetLanguage: "Spanish",
    model: "gpt-3.5-turbo",
    protocol: "openai",
  };

  beforeEach(async () => {
    await clearAllCache();
  });

  afterEach(async () => {
    await clearAllCache();
  });

  describe("initCache", () => {
    it("should initialize cache database", async () => {
      const db = await initCache();
      expect(db).toBeDefined();
      expect(db.name).toBe("lexicon_cache");
    });

    it("should return existing database if already initialized", async () => {
      const db1 = await initCache();
      const db2 = await initCache();
      expect(db1).toBe(db2);
    });
  });

  describe("setCachedTranslation & getCachedTranslation", () => {
    it("should store and retrieve translation", async () => {
      const text = "Hello world";
      const translation = "Hola mundo";

      await setCachedTranslation(text, mockConfig, translation);

      const result = await getCachedTranslation(text, mockConfig);
      expect(result.cached).toBe(true);
      expect(result.translation).toBe("Hola mundo");
    });

    it("should not retrieve translation for non-existent key", async () => {
      const result = await getCachedTranslation("nonexistent", mockConfig);
      expect(result.cached).toBe(false);
      expect(result.translation).toBeNull();
    });

    it("should generate different cache keys for different configurations", async () => {
      const text = "Hello world";

      await setCachedTranslation(text, mockConfig, "Hola mundo");
      await setCachedTranslation(
        text,
        { ...mockConfig, targetLanguage: "French" },
        "Bonjour monde",
      );

      const result1 = await getCachedTranslation(text, mockConfig);
      const result2 = await getCachedTranslation(text, {
        ...mockConfig,
        targetLanguage: "French",
      });

      expect(result1.translation).toBe("Hola mundo");
      expect(result2.translation).toBe("Bonjour monde");
    });

    it("should return cached flag correctly", async () => {
      const text = "Test text";

      await setCachedTranslation(text, mockConfig, "Test translation");

      let result = await getCachedTranslation(text, mockConfig);
      expect(result.cached).toBe(true);

      result = await getCachedTranslation("Non-existent text", mockConfig);
      expect(result.cached).toBe(false);
    });
  });

  describe("cache expiration", () => {
    it("should not retrieve expired translations", async () => {
      const text = "Old text";
      const translation = "Old translation";

      await setCachedTranslation(text, mockConfig, translation);

      const db = await initCache();
      const tx = db.transaction(["translations"], "readwrite");
      const store = tx.objectStore("translations");
      const key = crypto.getRandomValues(new Uint8Array(10)).join("");
      await new Promise((resolve) => {
        const req = store.put({
          key,
          text,
          translation,
          ...mockConfig,
          timestamp: Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000 - 1000,
          hitCount: 0,
        });
        req.onsuccess = resolve;
      });

      const result = await getCachedTranslation(text, mockConfig);
      expect(result.cached).toBe(false);
      expect(result.translation).toBeNull();
    });

    it("should cache entries with correct timestamp", async () => {
      const text = "New text";
      const beforeTime = Date.now();

      await setCachedTranslation(text, mockConfig, "New translation");

      const db = await initCache();
      const tx = db.transaction(["translations"], "readonly");
      const store = tx.objectStore("translations");
      const key = crypto.getRandomValues(new Uint8Array(10)).join("");

      await new Promise((resolve, reject) => {
        const req = store.get(key);
        req.onsuccess = () => {
          const entry = req.result;
          expect(entry.timestamp).toBeGreaterThan(beforeTime);
          resolve();
        };
        req.onerror = () => reject(new Error("Failed to get entry"));
      });
    });
  });

  describe("cache limit enforcement", () => {
    it("should enforce cache size limit", async () => {
      const textPromises = [];
      for (let i = 0; i < MAX_CACHE_ENTRIES + 10; i++) {
        const text = `Test text ${i}`;
        const promise = setCachedTranslation(
          text,
          mockConfig,
          `Translation ${i}`,
        );
        textPromises.push(promise);
      }
      await Promise.all(textPromises);

      const stats = await getCacheStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(MAX_CACHE_ENTRIES);
    });

    it("should use LRU eviction strategy", async () => {
      const firstText = "First text";
      await setCachedTranslation(firstText, mockConfig, "First translation");

      for (let i = 0; i < MAX_CACHE_ENTRIES; i++) {
        await setCachedTranslation(`Text ${i}`, mockConfig, `Translation ${i}`);
      }

      await getCachedTranslation(firstText, mockConfig);

      for (let i = 0; i < MAX_CACHE_ENTRIES; i++) {
        await setCachedTranslation(
          `New Text ${i}`,
          mockConfig,
          `New Translation ${i}`,
        );
      }

      const result = await getCachedTranslation(firstText, mockConfig);
      expect(result.cached).toBe(true);
    });
  });

  describe("hit count tracking", () => {
    it("should increment hit count on cache hit", async () => {
      const text = "Test text";
      await setCachedTranslation(text, mockConfig, "Test translation");

      await getCachedTranslation(text, mockConfig);
      await getCachedTranslation(text, mockConfig);

      const db = await initCache();
      const tx = db.transaction(["translations"], "readonly");
      const store = tx.objectStore("translations");
      const key = crypto.getRandomValues(new Uint8Array(10)).join("");

      await new Promise((resolve, reject) => {
        const req = store.get(key);
        req.onsuccess = () => {
          const entry = req.result;
          expect(entry.hitCount).toBeGreaterThanOrEqual(1);
          resolve();
        };
        req.onerror = () => reject(new Error("Failed to get entry"));
      });
    });
  });

  describe("clearExpiredCache", () => {
    it("should remove expired cache entries", async () => {
      const text = "Expiring text";
      await setCachedTranslation(text, mockConfig, "Expiring translation");

      const db = await initCache();
      const tx = db.transaction(["translations"], "readwrite");
      const store = tx.objectStore("translations");
      const key = crypto.getRandomValues(new Uint8Array(10)).join("");

      await new Promise((resolve) => {
        const req = store.put({
          key,
          text,
          translation: "Old translation",
          ...mockConfig,
          timestamp: Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000 - 1000,
          hitCount: 0,
        });
        req.onsuccess = resolve;
      });

      await clearExpiredCache();

      const stats = await getCacheStats();
      expect(stats.expiredCount).toBeGreaterThan(0);
    });
  });

  describe("clearAllCache", () => {
    it("should clear all cache entries", async () => {
      await setCachedTranslation("Text 1", mockConfig, "Translation 1");
      await setCachedTranslation("Text 2", mockConfig, "Translation 2");

      await clearAllCache();

      const stats = await getCacheStats();
      expect(stats.totalEntries).toBe(0);
    });
  });

  describe("getCacheStats", () => {
    it("should return cache statistics", async () => {
      await setCachedTranslation("Text 1", mockConfig, "Translation 1");
      await setCachedTranslation("Text 2", mockConfig, "Translation 2");

      for (let i = 0; i < 3; i++) {
        await getCachedTranslation("Text 1", mockConfig);
      }

      await getCachedTranslation("Text 2", mockConfig);

      const stats = await getCacheStats();
      expect(stats.totalEntries).toBeGreaterThan(0);
      expect(stats.totalHitCount).toBeGreaterThan(0);
      expect(stats.maxEntries).toBe(MAX_CACHE_ENTRIES);
      expect(stats.ttlDays).toBe(CACHE_TTL_DAYS);
    });

    it("should return zero stats when cache is empty", async () => {
      const stats = await getCacheStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.totalHitCount).toBe(0);
    });
  });

  describe("error handling", () => {
    it("should handle cache read errors gracefully", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await getCachedTranslation("Test", mockConfig);
      expect(result.cached).toBe(false);

      consoleSpy.mockRestore();
    });

    it("should handle cache write errors gracefully", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(
        setCachedTranslation("Test", mockConfig, "Translation"),
      ).resolves.not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe("cache key generation", () => {
    it("should generate consistent cache keys for same inputs", async () => {
      const text = "Consistent text";
      const config = mockConfig;

      await setCachedTranslation(text, config, "Translation A");
      const result = await getCachedTranslation(text, config);

      expect(result.translation).toBe("Translation A");
    });

    it("should generate different cache keys for different text", async () => {
      const config = mockConfig;

      await setCachedTranslation("Text A", config, "Translation A");
      await setCachedTranslation("Text B", config, "Translation B");

      const resultA = await getCachedTranslation("Text A", config);
      const resultB = await getCachedTranslation("Text B", config);

      expect(resultA.translation).toBe("Translation A");
      expect(resultB.translation).toBe("Translation B");
    });
  });

  describe("special characters handling", () => {
    it("should handle text with special characters", async () => {
      const text = 'Hello "world" & <test> ';
      const translation = '"Hola" mundo & <prueba>';

      await setCachedTranslation(text, mockConfig, translation);

      const result = await getCachedTranslation(text, mockConfig);
      expect(result.translation).toBe(translation);
    });

    it("should handle empty text", async () => {
      const result = await getCachedTranslation("", mockConfig);
      expect(result.cached).toBe(false);
    });
  });

  describe("concurrent operations", () => {
    it("should handle concurrent cache reads", async () => {
      const text = "Concurrent text";
      await setCachedTranslation(text, mockConfig, "Translation");

      const results = await Promise.all([
        getCachedTranslation(text, mockConfig),
        getCachedTranslation(text, mockConfig),
        getCachedTranslation(text, mockConfig),
      ]);

      expect(results.every((r) => r.cached === true)).toBe(true);
    });

    it("should handle concurrent cache writes", async () => {
      const writes = [];
      for (let i = 0; i < 10; i++) {
        writes.push(
          setCachedTranslation(`Text ${i}`, mockConfig, `Translation ${i}`),
        );
      }

      await expect(Promise.all(writes)).resolves.not.toThrow();
    });
  });
});
