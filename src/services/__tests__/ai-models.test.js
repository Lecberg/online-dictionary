import { describe, it, expect } from "vitest";
import {
  MODEL_TIERS,
  MODEL_CONFIG,
  MODEL_PRICING,
  selectOptimalModel,
  shouldFallback,
  getFallbackModel,
  estimateTokenCount,
  estimateCost,
  getRecommendedModel,
  isSupportedModel,
  PROTOCOL_MODELS,
} from "../ai-models.js";

describe("AI Models Service", () => {
  describe("MODEL_TIERS", () => {
    it("should define model tiers for each protocol", () => {
      expect(MODEL_TIERS.FAST).toBeDefined();
      expect(MODEL_TIERS.BALANCED).toBeDefined();
      expect(MODEL_TIERS.QUALITY).toBeDefined();
      expect(MODEL_TIERS.FAST.openai).toBe("gpt-3.5-turbo");
      expect(MODEL_TIERS.FAST.gemini).toBe("gemini-1.5-flash");
    });

    it("should have DEFAULT model for each tier", () => {
      expect(MODEL_TIERS.FAST.DEFAULT).toBeDefined();
      expect(MODEL_TIERS.BALANCED.DEFAULT).toBeDefined();
      expect(MODEL_TIERS.QUALITY.DEFAULT).toBeDefined();
    });
  });

  describe("MODEL_CONFIG", () => {
    it("should have configuration values defined", () => {
      expect(MODEL_CONFIG.AUTO_SELECT).toBeDefined();
      expect(MODEL_CONFIG.FAST_THRESHOLD).toBe(50);
      expect(MODEL_CONFIG.BALANCED_THRESHOLD).toBe(150);
      expect(MODEL_CONFIG.ENABLE_FALLBACK).toBeDefined();
    });
  });

  describe("selectOptimalModel", () => {
    it("should select FAST model for short text", () => {
      const shortText = "This is short";
      const model = selectOptimalModel(shortText, null, "openai");
      expect(model).toBe("gpt-3.5-turbo");
    });

    it("should select FAST model for text at threshold", () => {
      const text = "Word ".repeat(50).trim();
      const model = selectOptimalModel(text, null, "openai");
      expect(model).toBe("gpt-3.5-turbo");
    });

    it("should select BALANCED model for medium text", () => {
      const mediumText = "Word ".repeat(75).trim();
      const model = selectOptimalModel(mediumText, null, "openai");
      expect(model).toBe("gpt-4o-mini");
    });

    it("should select BALANCED model at upper threshold", () => {
      const text = "Word ".repeat(150).trim();
      const model = selectOptimalModel(text, null, "openai");
      expect(model).toBe("gpt-4o-mini");
    });

    it("should use fallback model for long text", () => {
      const longText = "Word ".repeat(200).trim();
      const fallback = "gpt-4o";
      const model = selectOptimalModel(longText, fallback, "openai");
      expect(model).toBe(fallback);
    });

    it("should protocol-specific models for OpenAI", () => {
      const model = selectOptimalModel("Short text", null, "openai");
      expect(model).toBe("gpt-3.5-turbo");
    });

    it("should protocol-specific models for Gemini", () => {
      const model = selectOptimalModel("Short text", null, "gemini");
      expect(model).toBe("gemini-1.5-flash");
    });

    it("should use FAST tier DEFAULT for unknown protocol", () => {
      const model = selectOptimalModel("Short text", null, "unknown");
      expect(model).toBe(MODEL_TIERS.FAST.DEFAULT);
    });
  });

  describe("shouldFallback", () => {
    it("should detect retryable timeout errors", () => {
      const error = new Error("Request timeout");
      expect(shouldFallback(error)).toBe(true);
    });

    it("should detect rate limit errors", () => {
      const error = new Error("Rate limit exceeded");
      expect(shouldFallback(error)).toBe(true);
    });

    it("should detect server errors", () => {
      const error = new Error("Server error 503");
      expect(shouldFallback(error)).toBe(true);
    });

    it("should detect 502 Bad Gateway", () => {
      const error = new Error("502 Bad Gateway");
      expect(shouldFallback(error)).toBe(true);
    });

    it("should detect 504 Gateway Timeout", () => {
      const error = new Error("504 Gateway Timeout");
      expect(shouldFallback(error)).toBe(true);
    });

    it("should not fallback on non-retryable errors", () => {
      const error = new Error("Invalid API key");
      expect(shouldFallback(error)).toBe(false);
    });

    it("should handle null errors", () => {
      expect(shouldFallback(null)).toBe(false);
    });

    it("should handle undefined errors", () => {
      expect(shouldFallback(undefined)).toBe(false);
    });

    it("should be case insensitive", () => {
      const error = new Error("TIMEOUT ERROR");
      expect(shouldFallback(error)).toBe(true);
    });
  });

  describe("getFallbackModel", () => {
    it("should return FAST model for BALANCED tier", () => {
      const fallback = getFallbackModel("gpt-4o-mini", "openai");
      expect(fallback).toBe("gpt-3.5-turbo");
    });

    it("should return FAST model for QUALITY tier", () => {
      const fallback = getFallbackModel("gpt-4o", "openai");
      expect(fallback).toBe("gpt-3.5-turbo");
    });

    it("should return BALANCED model for FAST tier", () => {
      const fallback = getFallbackModel("gpt-3.5-turbo", "openai");
      expect(fallback).toBe("gpt-4o-mini");
    });

    it("should return FAST DEFAULT for unsupported model", () => {
      const fallback = getFallbackModel("unsupported-model", "openai");
      expect(fallback).toBe(MODEL_TIERS.FAST.DEFAULT);
    });

    it("should handle Gemini protocol models", () => {
      const fallback = getFallbackModel("gemini-pro", "gemini");
      expect(fallback).toBe("gemini-1.5-flash");
    });
  });

  describe("estimateTokenCount", () => {
    it("should estimate token count from word count", () => {
      const text = "Hello world this is a test";
      const tokens = estimateTokenCount(text);
      expect(tokens).toBe(Math.ceil(7 * 1.3));
    });

    it("should handle single word", () => {
      const text = "Word";
      const tokens = estimateTokenCount(text);
      expect(tokens).toBe(Math.ceil(1 * 1.3));
    });

    it("should handle whitespace correctly", () => {
      const text = "   Multiple   spaces   between   words   ";
      const tokens = estimateTokenCount(text);
      expect(tokens).toBe(Math.ceil(4 * 1.3));
    });

    it("should handle empty string", () => {
      const tokens = estimateTokenCount("");
      expect(tokens).toBe(0);
    });

    it("should handle only whitespace", () => {
      const tokens = estimateTokenCount("   ");
      expect(tokens).toBe(0);
    });
  });

  describe("estimateCost", () => {
    it("should estimate cost for gpt-3.5-turbo", () => {
      const cost = estimateCost("gpt-3.5-turbo", 1000, 1000);
      expect(cost).toBeCloseTo(
        1000 * MODEL_PRICING["gpt-3.5-turbo"].input +
          1000 * MODEL_PRICING["gpt-3.5-turbo"].output,
      );
    });

    it("should handle zero tokens", () => {
      const cost = estimateCost("gpt-3.5-turbo", 0, 0);
      expect(cost).toBe(0);
    });

    it("should handle output tokens only", () => {
      const cost = estimateCost("gpt-3.5-turbo", 0, 1000);
      expect(cost).toBeCloseTo(1000 * MODEL_PRICING["gpt-3.5-turbo"].output);
    });

    it("should handle input tokens only", () => {
      const cost = estimateCost("gpt-3.5-turbo", 1000, 0);
      expect(cost).toBeCloseTo(1000 * MODEL_PRICING["gpt-3.5-turbo"].input);
    });

    it("should return 0 for unknown model", () => {
      const cost = estimateCost("unknown-model", 1000, 1000);
      expect(cost).toBe(0);
    });

    it("should handle Gemini models", () => {
      const cost = estimateCost("gemini-flash", 1000, 1000);
      expect(cost).toBe(0);
    });

    it("should handle gpt-4o pricing correctly", () => {
      const cost = estimateCost("gpt-4o", 1000, 1000);
      const expected =
        1000 * MODEL_PRICING["gpt-4o"].input +
        1000 * MODEL_PRICING["gpt-4o"].output;
      expect(cost).toBeCloseTo(expected);
    });
  });

  describe("getRecommendedModel", () => {
    it("should recommend FAST for short, simple text", () => {
      const recommendation = getRecommendedModel(40, "low");
      expect(recommendation.tier).toBe("FAST");
      expect(recommendation.model).toBe(MODEL_TIERS.FAST.DEFAULT);
      expect(recommendation.reason).toContain("Short text");
    });

    it("should recommend FAST at word count threshold", () => {
      const recommendation = getRecommendedModel(50, "low");
      expect(recommendation.tier).toBe("FAST");
    });

    it("should recommend BALANCED for medium text", () => {
      const recommendation = getRecommendedModel(100, "medium");
      expect(recommendation.tier).toBe("BALANCED");
      expect(recommendation.model).toBe(MODEL_TIERS.BALANCED.DEFAULT);
      expect(recommendation.reason).toContain("Medium-length");
    });

    it("should recommend BALANCED at upper threshold", () => {
      const recommendation = getRecommendedModel(150, "high");
      expect(recommendation.tier).toBe("BALANCED");
    });

    it("should recommend QUALITY for long text", () => {
      const recommendation = getRecommendedModel(200, "high");
      expect(recommendation.tier).toBe("QUALITY");
      expect(recommendation.model).toBe(MODEL_TIERS.QUALITY.DEFAULT);
      expect(recommendation.reason).toContain("Complex or long");
    });

    it("should ignore complexity for very long text", () => {
      const recommendation = getRecommendedModel(200, "low");
      expect(recommendation.tier).toBe("QUALITY");
    });
  });

  describe("isSupportedModel", () => {
    it("should return true for supported OpenAI models", () => {
      expect(isSupportedModel("gpt-3.5-turbo", "openai")).toBe(true);
      expect(isSupportedModel("gpt-4o-mini", "openai")).toBe(true);
      expect(isSupportedModel("gpt-4o", "openai")).toBe(true);
    });

    it("should return true for supported Gemini models", () => {
      expect(isSupportedModel("gemini-1.5-flash", "gemini")).toBe(true);
      expect(isSupportedModel("gemini-pro", "gemini")).toBe(true);
      expect(isSupportedModel("gemini-1.5-pro", "gemini")).toBe(true);
    });

    it("should return false for unsupported models", () => {
      expect(isSupportedModel("gpt-5", "openai")).toBe(false);
      expect(isSupportedModel("claude", "openai")).toBe(false);
    });

    it("should return false for unsupported protocols", () => {
      expect(isSupportedModel("gpt-3.5-turbo", "gemini")).toBe(false);
      expect(isSupportedModel("gemini-pro", "openai")).toBe(false);
    });

    it("should return false for empty/null protocol", () => {
      expect(isSupportedModel("gpt-3.5-turbo", "")).toBe(false);
      expect(isSupportedModel("gpt-3.5-turbo", null)).toBe(false);
    });
  });

  describe("MODEL_PRICING", () => {
    it("should have pricing for supported models", () => {
      expect(MODEL_PRICING["gpt-3.5-turbo"]).toBeDefined();
      expect(MODEL_PRICING["gpt-4o-mini"]).toBeDefined();
      expect(MODEL_PRICING["gpt-4o"]).toBeDefined();
      expect(MODEL_PRICING["gemini-1.5-flash"]).toBeDefined();
      expect(MODEL_PRICING["gemini-pro"]).toBeDefined();
      expect(MODEL_PRICING["gemini-1.5-pro"]).toBeDefined();
    });

    it("should have input and output pricing", () => {
      Object.values(MODEL_PRICING).forEach((pricing) => {
        expect(pricing.input).toBeDefined();
        expect(pricing.output).toBeDefined();
        expect(typeof pricing.input).toBe("number");
        expect(typeof pricing.output).toBe("number");
      });
    });
  });

  describe("PROTOCOL_MODELS", () => {
    it("should define models for OpenAI protocol", () => {
      expect(PROTOCOL_MODELS.openai).toBeDefined();
      expect(PROTOCOL_MODELS.openai.FAST).toBe("gpt-3.5-turbo");
      expect(PROTOCOL_MODELS.openai.BALANCED).toBe("gpt-4o-mini");
      expect(PROTOCOL_MODELS.openai.QUALITY).toBe("gpt-4o");
    });

    it("should define models for Gemini protocol", () => {
      expect(PROTOCOL_MODELS.gemini).toBeDefined();
      expect(PROTOCOL_MODELS.gemini.FAST).toBe("gemini-1.5-flash");
      expect(PROTOCOL_MODELS.gemini.BALANCED).toBe("gemini-pro");
      expect(PROTOCOL_MODELS.gemini.QUALITY).toBe("gemini-1.5-pro");
    });

    it("should have matching models between tiers and protocols", () => {
      Object.keys(PROTOCOL_MODELS.openai).forEach((tier) => {
        expect(MODEL_TIERS[tier].openai).toBe(PROTOCOL_MODELS.openai[tier]);
      });

      Object.keys(PROTOCOL_MODELS.gemini).forEach((tier) => {
        expect(MODEL_TIERS[tier].gemini).toBe(PROTOCOL_MODELS.gemini[tier]);
      });
    });
  });

  describe("word count edge cases for model selection", () => {
    it("should handle text at FAST threshold boundary", () => {
      const text = "word ".repeat(50).trim();
      expect(text.split(/\s+/).length).toBe(50);
      const model = selectOptimalModel(text, null, "openai");
      expect(model).toBe("gpt-3.5-turbo");
    });

    it("should handle text just above FAST threshold", () => {
      const text = "word ".repeat(51).trim();
      expect(text.split(/\s+/).length).toBe(51);
      const model = selectOptimalModel(text, null, "openai");
      expect(model).toBe("gpt-4o-mini");
    });

    it("should handle text at BALANCED threshold boundary", () => {
      const text = "word ".repeat(150).trim();
      expect(text.split(/\s+/).length).toBe(150);
      const model = selectOptimalModel(text, null, "openai");
      expect(model).toBe("gpt-4o-mini");
    });

    it("should handle text just above BALANCED threshold", () => {
      const text = "word ".repeat(151).trim();
      expect(text.split(/\s+/).length).toBe(151);
      const model = selectOptimalModel(text, null, "openai");
      expect(model).toBe("gpt-4o");
    });
  });

  describe("empty and null text handling", () => {
    it("should handle empty string for model selection", () => {
      const model = selectOptimalModel("", null, "openai");
      expect(model).toBe("gpt-3.5-turbo");
    });

    it("should handle whitespace-only string for model selection", () => {
      const model = selectOptimalModel("   ", null, "openai");
      expect(model).toBe("gpt-3.5-turbo");
    });

    it("should estimate 0 tokens for empty string", () => {
      const tokens = estimateTokenCount("");
      expect(tokens).toBe(0);
    });
  });
});
