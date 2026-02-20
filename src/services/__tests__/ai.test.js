import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { translateText, generateWordDefinition, AI_PROTOCOLS } from "../ai.js";

vi.mock("../cache.js", () => ({
  getCachedTranslation: vi.fn(),
  setCachedTranslation: vi.fn(),
}));

vi.mock("../ai-models.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    selectOptimalModel: vi.fn((text, model) => model || "gpt-3.5-turbo"),
    shouldFallback: vi.fn((error) => error.message && error.message.includes("502")),
    getFallbackModel: vi.fn(() => "gpt-3.5-turbo"),
    MODEL_CONFIG: {
      AUTO_SELECT: true,
      FAST_THRESHOLD: 50,
      BALANCED_THRESHOLD: 150,
      ENABLE_FALLBACK: true,
      FALLBACK_TIER: "FAST",
    },
    validateConfigModel: vi.fn(() => ({
      isValid: true,
      shouldAutoSelect: true,
    })),
    normalizeProtocol: vi.fn((p) => p),
  };
});

describe("AI Service - translateText", () => {
  const mockConfig = {
    protocol: "openai",
    apiKey: "test-key",
    targetLanguage: "Spanish",
    model: "gpt-3.5-turbo",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("cache integration", () => {
    it("should return cached translation when available", async () => {
      const { getCachedTranslation } = await import("../cache.js");
      getCachedTranslation.mockResolvedValue({
        cached: true,
        translation: "Hola mundo",
      });

      const result = await translateText("Hello world", mockConfig);

      expect(result).toEqual({ translation: "Hola mundo", cached: true });
      expect(getCachedTranslation).toHaveBeenCalledWith(
        "Hello world",
        mockConfig,
      );
    });

    it("should make API call when cache miss occurs", async () => {
      const { getCachedTranslation, setCachedTranslation } =
        await import("../cache.js");
      const { selectOptimalModel } = await import("../ai-models.js");

      getCachedTranslation.mockResolvedValue({
        cached: false,
        translation: null,
      });
      selectOptimalModel.mockReturnValue("gpt-3.5-turbo");
      setCachedTranslation.mockResolvedValue();

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Hola mundo" } }],
            }),
        }),
      );

      const result = await translateText("Hello world", mockConfig);

      expect(result.cached).toBe(false);
      expect(result.translation).toBe("Hola mundo");
      expect(setCachedTranslation).toHaveBeenCalledWith(
        "Hello world",
        mockConfig,
        "Hola mundo",
      );
    });

    it("should not call setCachedTranslation when API fails", async () => {
      const { getCachedTranslation, setCachedTranslation } =
        await import("../cache.js");
      const { selectOptimalModel } = await import("../ai-models.js");

      getCachedTranslation.mockResolvedValue({
        cached: false,
        translation: null,
      });
      selectOptimalModel.mockReturnValue("gpt-3.5-turbo");

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: { message: "API error" } }),
        }),
      );

      await expect(translateText("Hello world", mockConfig)).rejects.toThrow();
      expect(setCachedTranslation).not.toHaveBeenCalled();
    });
  });

  describe("request deduplication", () => {
    it("should prevent duplicate requests", async () => {
      const { getCachedTranslation } = await import("../cache.js");
      const { selectOptimalModel } = await import("../ai-models.js");

      getCachedTranslation.mockResolvedValue({
        cached: false,
        translation: null,
      });
      selectOptimalModel.mockReturnValue("gpt-3.5-turbo");

      let apiCallCount = 0;
      global.fetch = vi.fn(() => {
        apiCallCount++;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Hola mundo" } }],
            }),
        });
      });

      const promises = [
        translateText("Hello world", mockConfig),
        translateText("Hello world", mockConfig),
        translateText("Hello world", mockConfig),
      ];

      await Promise.all(promises);

      expect(apiCallCount).toBe(1);
    });

    it("should allow different texts to be processed in parallel", async () => {
      const { getCachedTranslation } = await import("../cache.js");
      const { selectOptimalModel } = await import("../ai-models.js");

      getCachedTranslation.mockResolvedValue({
        cached: false,
        translation: null,
      });
      selectOptimalModel.mockReturnValue("gpt-3.5-turbo");

      let apiCallCount = 0;
      global.fetch = vi.fn(() => {
        apiCallCount++;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Translation" } }],
            }),
        });
      });

      const promises = [
        translateText("Text 1", mockConfig),
        translateText("Text 2", mockConfig),
        translateText("Text 3", mockConfig),
      ];

      await Promise.all(promises);

      expect(apiCallCount).toBe(3);
    });
  });

  describe("auto model selection", () => {
    it("should use auto-selected model when AUTO_SELECT is true", async () => {
      const { getCachedTranslation } = await import("../cache.js");
      const { selectOptimalModel } = await import("../ai-models.js");

      getCachedTranslation.mockResolvedValue({
        cached: false,
        translation: null,
      });
      selectOptimalModel.mockReturnValue("gpt-3.5-turbo");

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Texto" } }],
            }),
        }),
      );

      await translateText("Test text", mockConfig);

      expect(selectOptimalModel).toHaveBeenCalledWith(
        "Test text",
        "gpt-3.5-turbo",
        "openai",
      );
    });

    it("should return model used in result", async () => {
      const { getCachedTranslation } = await import("../cache.js");
      const { selectOptimalModel } = await import("../ai-models.js");

      getCachedTranslation.mockResolvedValue({
        cached: false,
        translation: null,
      });
      selectOptimalModel.mockReturnValue("gpt-3.5-turbo");

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Translation" } }],
            }),
        }),
      );

      const result = await translateText("Test", { ...mockConfig, model: "" });

      expect(result.modelUsed).toBe("gpt-3.5-turbo");
    });

    it("should restore original model after translation", async () => {
      const originalModel = "gpt-4o";
      const configWithOriginal = { ...mockConfig, model: originalModel };

      const { getCachedTranslation } = await import("../cache.js");
      const { selectOptimalModel } = await import("../ai-models.js");

      getCachedTranslation.mockResolvedValue({
        cached: false,
        translation: null,
      });
      selectOptimalModel.mockReturnValue("gpt-3.5-turbo");

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Translation" } }],
            }),
        }),
      );

      await translateText("Test", configWithOriginal);

      expect(configWithOriginal.model).toBe(originalModel);
    });
  });

  describe("error handling and fallback", () => {
    it("should throw error when request fails without fallback", async () => {
      const { getCachedTranslation } = await import("../cache.js");
      const { shouldFallback, getFallbackModel, MODEL_CONFIG } =
        await import("../ai-models.js");

      getCachedTranslation.mockResolvedValue({
        cached: false,
        translation: null,
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({ error: { message: "Invalid API key" } }),
        }),
      );

      shouldFallback.mockReturnValue(false);
      MODEL_CONFIG.ENABLE_FALLBACK = true;

      await expect(translateText("Test", mockConfig)).rejects.toThrow();
    });

    it("should use fallback model when error is retryable", async () => {
      const { getCachedTranslation } = await import("../cache.js");
      const { setCachedTranslation } = await import("../cache.js");
      const {
        selectOptimalModel,
        shouldFallback,
        getFallbackModel,
        MODEL_CONFIG,
      } = await import("../ai-models.js");

      getCachedTranslation.mockResolvedValue({
        cached: false,
        translation: null,
      });
      selectOptimalModel.mockReturnValue("gpt-4o");
      shouldFallback.mockReturnValue(true);
      getFallbackModel.mockReturnValue("gpt-3.5-turbo");
      MODEL_CONFIG.ENABLE_FALLBACK = true;

      let apiCallCount = 0;
      global.fetch = vi.fn(() => {
        apiCallCount++;
        if (apiCallCount === 1) {
          return Promise.resolve({
            ok: false,
            json: () =>
              Promise.resolve({ error: { message: "Request timeout" } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Fallback translation" } }],
            }),
        });
      });

      const result = await translateText("Test", { ...mockConfig, model: "" });

      expect(result.translation).toBe("Fallback translation");
      expect(result.fallback).toBe(true);
      expect(result.modelUsed).toBe("gpt-3.5-turbo");
      expect(setCachedTranslation).toHaveBeenCalled();
    });
  });

  describe("input validation", () => {
    it("should throw error when text is missing", async () => {
      await expect(translateText("", mockConfig)).rejects.toThrow(
        "Text and config are required",
      );
    });

    it("should throw error when config is missing", async () => {
      await expect(translateText("Test text", null)).rejects.toThrow(
        "Text and config are required",
      );
    });

    it("should throw error when both are missing", async () => {
      await expect(translateText("", null)).rejects.toThrow(
        "Text and config are required",
      );
    });
  });

  describe("pending request cleanup", () => {
    it("should remove completed requests from pending map", async () => {
      const { getCachedTranslation } = await import("../cache.js");
      const { selectOptimalModel } = await import("../ai-models.js");

      getCachedTranslation.mockResolvedValue({
        cached: false,
        translation: null,
      });
      selectOptimalModel.mockReturnValue("gpt-3.5-turbo");

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Translation" } }],
            }),
        }),
      );

      await translateText("Test", mockConfig);

      const requestKey = "Test||Spanish||gpt-3.5-turbo||openai";

      const aiModule = await import("../ai.js");
      expect(aiModule.pendingRequests.has(requestKey)).toBe(false);
    });
  });

  describe("message construction", () => {
    it("should construct proper system prompt with target language", async () => {
      const { getCachedTranslation } = await import("../cache.js");
      const { selectOptimalModel } = await import("../ai-models.js");

      getCachedTranslation.mockResolvedValue({
        cached: false,
        translation: null,
      });
      selectOptimalModel.mockReturnValue("gpt-3.5-turbo");

      let capturedBody;
      global.fetch = vi.fn((url, options) => {
        capturedBody = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Translation" } }],
            }),
        });
      });

      await translateText("Test", { ...mockConfig, targetLanguage: "French" });

      expect(capturedBody.messages[0].content).toContain("French");
    });
  });

  describe("special characters", () => {
    it("should handle text with special characters", async () => {
      const { getCachedTranslation, setCachedTranslation } =
        await import("../cache.js");
      const { selectOptimalModel } = await import("../ai-models.js");

      getCachedTranslation.mockResolvedValue({
        cached: false,
        translation: null,
      });
      selectOptimalModel.mockReturnValue("gpt-3.5-turbo");
      setCachedTranslation.mockResolvedValue();

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Translation" } }],
            }),
        }),
      );

      const specialText = 'Hello "world" & <test> ';
      await expect(
        translateText(specialText, mockConfig),
      ).resolves.toBeDefined();
    });
  });
});

describe("AI Service - generateWordDefinition", () => {
  const mockConfig = {
    protocol: "openai",
    apiKey: "test-key",
    targetLanguage: "English",
    model: "gpt-3.5-turbo",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("request deduplication for definitions", () => {
    it("should prevent duplicate definition requests", async () => {
      const { selectOptimalModel } = await import("../ai-models.js");

      selectOptimalModel.mockReturnValue("gpt-3.5-turbo");

      let apiCallCount = 0;
      global.fetch = vi.fn(() => {
        apiCallCount++;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Definition here" } }],
            }),
        });
      });

      const promises = [
        generateWordDefinition("test", mockConfig),
        generateWordDefinition("test", mockConfig),
        generateWordDefinition("test", mockConfig),
      ];

      await Promise.all(promises);

      expect(apiCallCount).toBe(1);
    });

    it("should allow different words to be processed in parallel", async () => {
      const { selectOptimalModel } = await import("../ai-models.js");

      selectOptimalModel.mockReturnValue("gpt-3.5-turbo");

      let apiCallCount = 0;
      global.fetch = vi.fn(() => {
        apiCallCount++;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Definition" } }],
            }),
        });
      });

      const promises = [
        generateWordDefinition("word1", mockConfig),
        generateWordDefinition("word2", mockConfig),
        generateWordDefinition("word3", mockConfig),
      ];

      await Promise.all(promises);

      expect(apiCallCount).toBe(3);
    });
  });

  describe("auto model selection for definitions", () => {
    it("should use auto-selected model for word definitions", async () => {
      const { selectOptimalModel } = await import("../ai-models.js");

      selectOptimalModel.mockReturnValue("gpt-3.5-turbo");

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Definition" } }],
            }),
        }),
      );

      const result = await generateWordDefinition("serendipity", mockConfig);

      expect(result.modelUsed).toBe("gpt-3.5-turbo");
      expect(result.definition).toBe("Definition");
    });

    it("should return model used in definition result", async () => {
      const { selectOptimalModel } = await import("../ai-models.js");

      selectOptimalModel.mockReturnValue("gpt-4o-mini");

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Definition" } }],
            }),
        }),
      );

      const result = await generateWordDefinition("test", { ...mockConfig, model: "" });

      expect(result.modelUsed).toBe("gpt-4o-mini");
    });
  });

  describe("error handling for definitions", () => {
    it("should handle API errors gracefully", async () => {
      const { shouldFallback, MODEL_CONFIG } = await import("../ai-models.js");

      shouldFallback.mockReturnValue(false);
      MODEL_CONFIG.ENABLE_FALLBACK = true;

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: { message: "API error" } }),
        }),
      );

      await expect(
        generateWordDefinition("test", mockConfig),
      ).rejects.toThrow();
    });

    it("should use fallback model for definitions on retryable error", async () => {
      const {
        selectOptimalModel,
        shouldFallback,
        getFallbackModel,
        MODEL_CONFIG,
      } = await import("../ai-models.js");

      selectOptimalModel.mockReturnValue("gpt-4o");
      shouldFallback.mockReturnValue(true);
      getFallbackModel.mockReturnValue("gpt-3.5-turbo");
      MODEL_CONFIG.ENABLE_FALLBACK = true;

      let apiCallCount = 0;
      global.fetch = vi.fn(() => {
        apiCallCount++;
        if (apiCallCount === 1) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: { message: "Timeout" } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Fallback definition" } }],
            }),
        });
      });

      const result = await generateWordDefinition("test", { ...mockConfig, model: "" });

      expect(result.definition).toBe("Fallback definition");
      expect(result.fallback).toBe(true);
      expect(result.modelUsed).toBe("gpt-3.5-turbo");
    });
  });

  describe("input validation for definitions", () => {
    it("should throw error when word is missing", async () => {
      await expect(generateWordDefinition("", mockConfig)).rejects.toThrow(
        "Word and config are required",
      );
    });

    it("should throw error when config is missing", async () => {
      await expect(generateWordDefinition("test", null)).rejects.toThrow(
        "Word and config are required",
      );
    });
  });

  describe("message construction for definitions", () => {
    it("should construct proper lexicographer prompt", async () => {
      const { selectOptimalModel } = await import("../ai-models.js");

      selectOptimalModel.mockReturnValue("gpt-3.5-turbo");

      let capturedBody;
      global.fetch = vi.fn((url, options) => {
        capturedBody = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Definition" } }],
            }),
        });
      });

      await generateWordDefinition("test", {
        ...mockConfig,
        targetLanguage: "Spanish",
      });

      expect(capturedBody.messages[0].content).toContain("lexicographer");
      expect(capturedBody.messages[0].content).toContain("Spanish");
    });
  });

  describe("pending request cleanup for definitions", () => {
    it("should remove completed definition requests from pending map", async () => {
      const { selectOptimalModel } = await import("../ai-models.js");

      selectOptimalModel.mockReturnValue("gpt-3.5-turbo");

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: "Definition" } }],
            }),
        }),
      );

      await generateWordDefinition("test", mockConfig);

      const requestKey = "definition:test||gpt-3.5-turbo||openai";

      const aiModule = await import("../ai.js");
      expect(aiModule.pendingRequests.has(requestKey)).toBe(false);
    });
  });
});

describe("AI Protocol Constants", () => {
  it("should define OPENAI protocol", () => {
    expect(AI_PROTOCOLS.OPENAI).toBe("openai");
  });

  it("should define GEMINI protocol", () => {
    expect(AI_PROTOCOLS.GEMINI).toBe("gemini");
  });
});
