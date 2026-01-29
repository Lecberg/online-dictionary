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
        throw new Error(
          `Server returned HTML (likely 404/500). Check your Host URL: ${cleanUrl}`,
        );
      }
      const error = await response.json();
      throw new Error(
        error.error?.message ||
          error.message ||
          `API Error (${response.status})`,
      );
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
  const messages = [
    {
      role: "system",
      content: `You are a translator. Translate the following text to ${config.targetLanguage || "Spanish"}. Provide only the translation, no explanations.`,
    },
    { role: "user", content: text },
  ];
  return fetchAI(messages, config);
};

export const generateWordDefinition = async (word, config) => {
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
  return fetchAI(messages, config);
};
