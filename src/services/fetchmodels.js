const MODELS_CACHE_PREFIX = "lexicon_models_cache_";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const GEMINI_MODELS = [
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Fast)" },
  { id: "gemini-pro", name: "Gemini Pro (Balanced)" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Quality)" },
];

async function fetchOpenAIModels(host, apiKey) {
  const baseUrl = host.replace(/\/$/, "");
  const modelsUrl = `${baseUrl}/models`;

  const response = await fetch(modelsUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch models (${response.status}): ${error.error?.message || response.statusText}`,
    );
  }

  const data = await response.json();

  return data.data.map((model) => ({
    id: model.id,
    name: model.id,
    owned_by: model.owned_by,
  }));
}

function getCachedModels(host) {
  const cacheKey = MODELS_CACHE_PREFIX + (host || "default");
  const cached = localStorage.getItem(cacheKey);

  if (!cached) return null;

  try {
    const { models, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    return age < CACHE_TTL_MS ? models : null;
  } catch (error) {
    console.error("Error reading models cache:", error);
    return null;
  }
}

function setCachedModels(host, models) {
  const cacheKey = MODELS_CACHE_PREFIX + (host || "default");
  localStorage.setItem(
    cacheKey,
    JSON.stringify({
      models,
      timestamp: Date.now(),
    }),
  );
}

export async function fetchAvailableModels(config) {
  const { protocol, host, apiKey } = config;

  if (!protocol) {
    throw new Error("Protocol is required to fetch models");
  }

  const normalizedProtocol = protocol.toLowerCase().trim();

  if (normalizedProtocol !== "openai" && normalizedProtocol !== "gemini") {
    throw new Error(
      `Model fetching is only supported for OpenAI and Gemini protocols. Current: ${normalizedProtocol}`,
    );
  }

  const cached = getCachedModels(host);
  if (cached) {
    console.debug("Loaded models from cache:", cached.length, "models");
    return { models: cached, source: "cache" };
  }

  let models;

  if (normalizedProtocol === "gemini") {
    models = GEMINI_MODELS.map((m) => ({ id: m.id, name: m.name || m.id }));
    console.debug("Using hardcoded Gemini models:", models.length);
  } else {
    const normalizedHost = host || "https://api.openai.com/v1";
    models = await fetchOpenAIModels(normalizedHost, apiKey);
    console.debug(`Fetched ${models.length} models from API`);
  }

  setCachedModels(host || "default", models);

  return { models, source: "api" };
}

export function clearModelsCache(host) {
  const cacheKey = MODELS_CACHE_PREFIX + (host || "default");
  localStorage.removeItem(cacheKey);
}

export function getModelsCache(host) {
  return getCachedModels(host);
}

export function getAllCachedHosts() {
  const hosts = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(MODELS_CACHE_PREFIX)) {
      hosts.push(key.replace(MODELS_CACHE_PREFIX, ""));
    }
  }
  return hosts;
}
