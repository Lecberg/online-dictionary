import { getCachedTranslation, setCachedTranslation } from "./cache.js";
import {
  selectOptimalModel,
  shouldFallback,
  getFallbackModel,
  MODEL_CONFIG,
  normalizeProtocol,
  validateConfigModel,
  getProtocolDetails,
} from "./ai-models.js";

const deobfuscate = (text) => {
  if (!text) return "";
  try {
    return atob(text);
  } catch (e) {
    return text;
  }
};

export const AI_PROTOCOLS = {
  OPENAI: "openai",
  GEMINI: "gemini",
};

const pendingRequests = new Map();

const generateRequestKey = (text, config) => {
  return `${text}||${config.targetLanguage || "Spanish"}||${config.model || "gpt-3.5-turbo"}||${config.protocol || "openai"}`;
};

const fetchAI = async (messages, config) => {
  const { protocol, apiKey, model, host } = config;
  const key = deobfuscate(apiKey).trim();

  if (protocol === AI_PROTOCOLS.OPENAI) {
    const baseUrl = host || "https://api.openai.com/v1";
    const cleanUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

    const response = await fetch(`${cleanUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: model || "gpt-3.5-turbo",
        messages: messages,
      }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        const errorMsg = `Server returned HTML (likely 404/500). Check your Host URL: ${cleanUrl}`;
        console.error("API Error details:", {
          protocol: config.protocol,
          model: config.model,
          host: cleanUrl,
          status: response.status,
          message: errorMsg,
        });
        throw new Error(errorMsg);
      }
      const error = await response.json();
      const errorMsg =
        error.error?.message ||
        error.message ||
        `API Error (${response.status}`;

      console.error("API Error details:", {
        protocol: config.protocol,
        model: config.model,
        host: cleanUrl,
        status: response.status,
        message: errorMsg,
      });

      throw new Error(`API Error (${response.status}): ${errorMsg}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  if (protocol === AI_PROTOCOLS.GEMINI) {
    const baseUrl =
      host || "https://generativelanguage.googleapis.com/v1beta/models";

    // Convert OpenAI messages to Gemini contents
    const contents = messages.map((m) => ({
      role: m.role === "system" ? "user" : m.role,
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `${baseUrl}/${model || "gemini-pro"}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: contents,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Gemini API Error");
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  }

  throw new Error("Unsupported Protocol");
};

export const translateText = async (text, config) => {
  if (!text || !config) {
    throw new Error("Text and config are required for translation");
  }

  const requestKey = generateRequestKey(text, config);

  const cachedResult = await getCachedTranslation(text, config);
  if (cachedResult.cached) {
    return { translation: cachedResult.translation, cached: true };
  }

  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }

  const requestPromise = performTranslation(text, config);
  pendingRequests.set(requestKey, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    pendingRequests.delete(requestKey);
  }
};

const performTranslation = async (text, config) => {
  const originalModel = config.model;
  const originalProtocol = config.protocol;

  console.debug("performTranslation called:", {
    protocol: config.protocol,
    userModel: config.model,
    wordCount: text.split(/\s+/).length,
    autoSelect: MODEL_CONFIG.AUTO_SELECT,
  });

  if (!config || !config.protocol) {
    console.error("Invalid config: missing protocol", config);
    throw new Error("Invalid configuration: protocol is required");
  }

  const validation = validateConfigModel(config);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  if (MODEL_CONFIG.AUTO_SELECT && validation.shouldAutoSelect) {
    const normalizedProtocol = normalizeProtocol(config.protocol);
    config.protocol = normalizedProtocol;

    const optimalModel = selectOptimalModel(
      text,
      originalModel || undefined,
      config.protocol,
    );

    if (!originalModel || !originalModel.trim()) {
      config.model = optimalModel;
      console.debug(
        `Auto-selected model: ${optimalModel} (protocol: ${config.protocol})`,
      );
    } else {
      console.debug(`Using user-specified model: ${originalModel}`);
    }
  }

  const messages = [
    {
      role: "system",
      content: `You are a translator. Translate the following text to ${config.targetLanguage || "Spanish"}. Provide only the translation, no explanations.`,
    },
    { role: "user", content: text },
  ];

  try {
    const translation = await fetchAI(messages, config);

    await setCachedTranslation(text, config, translation);

    return { translation, cached: false, modelUsed: config.model };
  } catch (error) {
    if (MODEL_CONFIG.ENABLE_FALLBACK && shouldFallback(error)) {
      const fallbackModel = getFallbackModel(config.model, config.protocol);

      if (fallbackModel !== config.model) {
        config.model = fallbackModel;
        const retryMessages = [
          {
            role: "system",
            content: `You are a translator. Translate the following text to ${config.targetLanguage || "Spanish"}. Provide only the translation, no explanations.`,
          },
          { role: "user", content: text },
        ];

        const translation = await fetchAI(retryMessages, config);

        await setCachedTranslation(text, config, translation);

        return {
          translation,
          cached: false,
          modelUsed: config.model,
          fallback: true,
        };
      }
    }

    throw error;
  } finally {
    config.model = originalModel;
  }
};

export const generateWordDefinition = async (word, config) => {
  if (!word || !config) {
    throw new Error("Word and config are required for definition generation");
  }

  const requestKey = `definition:${word}||${config.model || "gpt-3.5-turbo"}||${config.protocol || "openai"}`;

  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }

  const requestPromise = performDefinitionGeneration(word, config);
  pendingRequests.set(requestKey, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    pendingRequests.delete(requestKey);
  }
};

const performDefinitionGeneration = async (word, config) => {
  const originalModel = config.model;
  const originalProtocol = config.protocol;

  console.debug("performDefinitionGeneration called:", {
    protocol: config.protocol,
    userModel: config.model,
    wordCount: word.split(/\s+/).length,
    autoSelect: MODEL_CONFIG.AUTO_SELECT,
  });

  if (!config || !config.protocol) {
    console.error("Invalid config: missing protocol", config);
    throw new Error("Invalid configuration: protocol is required");
  }

  const validation = validateConfigModel(config);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  if (MODEL_CONFIG.AUTO_SELECT && validation.shouldAutoSelect) {
    const normalizedProtocol = normalizeProtocol(config.protocol);
    config.protocol = normalizedProtocol;

    const optimalModel = selectOptimalModel(
      word,
      originalModel || undefined,
      config.protocol,
    );

    if (!originalModel || !originalModel.trim()) {
      config.model = optimalModel;
      console.debug(
        `Auto-selected model: ${optimalModel} (protocol: ${config.protocol})`,
      );
    } else {
      console.debug(`Using user-specified model: ${originalModel}`);
    }
  }

  const messages = [
    {
      role: "system",
      content: `You are an expert lexicographer. Provide a detailed dictionary entry for the requested word in ${config.targetLanguage || "English"}.`,
    },
    {
      role: "user",
      content: `Please provide meanings, part of speech, and examples for the word: "${word}". Format the response using Markdown for clarity.`,
    },
  ];

  try {
    const definition = await fetchAI(messages, config);
    return { definition, modelUsed: config.model };
  } catch (error) {
    if (MODEL_CONFIG.ENABLE_FALLBACK && shouldFallback(error)) {
      const fallbackModel = getFallbackModel(config.model, config.protocol);

      if (fallbackModel !== config.model) {
        config.model = fallbackModel;
        const retryMessages = [
          {
            role: "system",
            content: `You are an expert lexicographer. Provide a detailed dictionary entry for the requested word in ${config.targetLanguage || "English"}.`,
          },
          {
            role: "user",
            content: `Please provide meanings, part of speech, and examples for the word: "${word}". Format the response using Markdown for clarity.`,
          },
        ];

        const definition = await fetchAI(retryMessages, config);
        return { definition, modelUsed: config.model, fallback: true };
      }
    }

    throw error;
  } finally {
    config.model = originalModel;
  }
};
