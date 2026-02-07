export const MODEL_TIERS = {
  FAST: {
    openai: "gpt-3.5-turbo",
    gemini: "gemini-1.5-flash",
    DEFAULT: "gpt-3.5-turbo",
  },
  BALANCED: {
    openai: "gpt-4o-mini",
    gemini: "gemini-pro",
    DEFAULT: "gpt-4o-mini",
  },
  QUALITY: {
    openai: "gpt-4o",
    gemini: "gemini-1.5-pro",
    DEFAULT: "gpt-4o",
  },
};

export const MODEL_CONFIG = {
  AUTO_SELECT: true,
  FAST_THRESHOLD: 50,
  BALANCED_THRESHOLD: 150,
  ENABLE_FALLBACK: true,
};

export const MODEL_PRICING = {
  "gpt-3.5-turbo": { input: 0.000005, output: 0.000015 },
  "gpt-4o-mini": { input: 0.0000015, output: 0.000002 },
  "gpt-4o": { input: 0.0000025, output: 0.00001 },
  "gemini-1.5-flash": { input: 0.0000001, output: 0.0000001 },
  "gemini-pro": { input: 0.00000025, output: 0.0000005 },
  "gemini-1.5-pro": { input: 0.00000125, output: 0.000005 },
};

export const PROTOCOL_MODELS = {
  openai: {
    FAST: MODEL_TIERS.FAST.openai,
    BALANCED: MODEL_TIERS.BALANCED.openai,
    QUALITY: MODEL_TIERS.QUALITY.openai,
  },
  gemini: {
    FAST: MODEL_TIERS.FAST.gemini,
    BALANCED: MODEL_TIERS.BALANCED.gemini,
    QUALITY: MODEL_TIERS.QUALITY.gemini,
  },
};

export const selectOptimalModel = (text, fallbackModel, protocol) => {
  const wordCount = text.trim().split(/\s+/).length;

  if (wordCount <= MODEL_CONFIG.FAST_THRESHOLD) {
    return PROTOCOL_MODELS[protocol]?.FAST || MODEL_TIERS.FAST.DEFAULT;
  }

  if (wordCount <= MODEL_CONFIG.BALANCED_THRESHOLD) {
    return PROTOCOL_MODELS[protocol]?.BALANCED || MODEL_TIERS.BALANCED.DEFAULT;
  }

  return fallbackModel || MODEL_TIERS.QUALITY.DEFAULT;
};

export const shouldFallback = (error) => {
  if (!error) return false;

  const errorMessage = error.message.toLowerCase();
  const retryableErrors = [
    "timeout",
    "rate limit",
    "rate_limit_exceeded",
    "server error",
    "502",
    "503",
    "504",
  ];

  return retryableErrors.some((pattern) => errorMessage.includes(pattern));
};

export const getFallbackModel = (model, protocol) => {
  const currentTier = Object.values(PROTOCOL_MODELS[protocol]).includes(model)
    ? Object.keys(PROTOCOL_MODELS[protocol]).find(
        (tier) => PROTOCOL_MODELS[protocol][tier] === model,
      )
    : null;

  if (!currentTier) {
    return MODEL_TIERS.FAST.DEFAULT;
  }

  if (currentTier === "BALANCED" || currentTier === "QUALITY") {
    return MODEL_TIERS.FAST[protocol] || MODEL_TIERS.FAST.DEFAULT;
  }

  return MODEL_TIERS.BALANCED[protocol] || MODEL_TIERS.BALANCED.DEFAULT;
};

export const estimateTokenCount = (text) => {
  return Math.ceil(text.trim().split(/\s+/).length * 1.3);
};

export const estimateCost = (model, inputTokens, outputTokens = 0) => {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  return inputTokens * pricing.input + outputTokens * pricing.output;
};

export const getRecommendedModel = (textLength, complexity) => {
  const wordCount = textLength;

  if (wordCount <= 50 && complexity === "low") {
    return {
      tier: "FAST",
      model: MODEL_TIERS.FAST.DEFAULT,
      reason: "Short text, simple content",
    };
  }

  if (wordCount <= 150) {
    return {
      tier: "BALANCED",
      model: MODEL_TIERS.BALANCED.DEFAULT,
      reason: "Medium-length content",
    };
  }

  return {
    tier: "QUALITY",
    model: MODEL_TIERS.QUALITY.DEFAULT,
    reason: "Complex or long content",
  };
};

export const isSupportedModel = (model, protocol) => {
  const protocolModels = PROTOCOL_MODELS[protocol];
  if (!protocolModels) return false;

  return Object.values(protocolModels).includes(model);
};
