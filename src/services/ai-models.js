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

const normalizeProtocol = (protocol) => {
  if (!protocol) return "openai";
  const p = protocol.toLowerCase().trim();

  const protocolMap = {
    openai: "openai",
    chatgpt: "openai",
    gpt: "openai",
    gemini: "gemini",
    google: "gemini",
    geminipro: "gemini",
  };

  const normalized = protocolMap[p] || p;

  if (!PROTOCOL_MODELS[normalized]) {
    console.warn(`Unsupported protocol "${protocol}", falling back to openai`);
    return "openai";
  }

  return normalized;
};

export const selectOptimalModel = (text, fallbackModel, protocol) => {
  const normalizedProtocol = normalizeProtocol(protocol);
  const wordCount = text.trim().split(/\s+/).length;

  const protocolModels = PROTOCOL_MODELS[normalizedProtocol];

  if (!protocolModels) {
    console.error(`No models found for protocol: ${normalizedProtocol}`);
    return MODEL_TIERS.FAST.DEFAULT;
  }

  if (wordCount <= MODEL_CONFIG.FAST_THRESHOLD) {
    return protocolModels.FAST || MODEL_TIERS.FAST.DEFAULT;
  }

  if (wordCount <= MODEL_CONFIG.BALANCED_THRESHOLD) {
    return protocolModels.BALANCED || MODEL_TIERS.BALANCED.DEFAULT;
  }

  return fallbackModel || protocolModels.QUALITY || MODEL_TIERS.QUALITY.DEFAULT;
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
  const normalizedProtocol = normalizeProtocol(protocol);
  const protocolModels = PROTOCOL_MODELS[normalizedProtocol];
  const currentTier =
    protocolModels && Object.values(protocolModels).includes(model)
      ? Object.keys(protocolModels).find(
          (tier) => protocolModels[tier] === model,
        )
      : null;

  if (!currentTier) {
    return MODEL_TIERS.FAST.DEFAULT;
  }

  if (currentTier === "BALANCED" || currentTier === "QUALITY") {
    return MODEL_TIERS.FAST[normalizedProtocol] || MODEL_TIERS.FAST.DEFAULT;
  }

  return (
    MODEL_TIERS.BALANCED[normalizedProtocol] || MODEL_TIERS.BALANCED.DEFAULT
  );
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

export const validateConfigModel = (config) => {
  const { protocol, model } = config;

  if (!protocol) {
    return { isValid: false, error: "Protocol is required" };
  }

  if (model && model.trim()) {
    const normalized = normalizeProtocol(protocol);
    const protocolModels = PROTOCOL_MODELS[normalized];

    if (!protocolModels || !Object.values(protocolModels).includes(model)) {
      console.warn(
        `Model "${model}" may not be supported for protocol "${protocol}"`,
      );
    }

    return { isValid: true, shouldAutoSelect: false };
  }

  return { isValid: true, shouldAutoSelect: true };
};

export { normalizeProtocol };

export const getProtocolDetails = (protocol) => {
  const normalized = normalizeProtocol(protocol);
  const models = PROTOCOL_MODELS[normalized];
  return {
    protocol: normalized,
    models: models || {},
    isValid: !!models,
    displayName: normalized.charAt(0).toUpperCase() + normalized.slice(1),
  };
};
