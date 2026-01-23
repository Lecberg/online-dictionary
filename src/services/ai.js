const obfuscate = (text) => {
  if (!text) return "";
  return btoa(text).split("").reverse().join("");
};

const deobfuscate = (text) => {
  if (!text) return "";
  try {
    return atob(text.split("").reverse().join(""));
  } catch (e) {
    return "";
  }
};

export const AI_PROTOCOLS = {
  OPENAI: "openai",
  GEMINI: "gemini",
};

export const translateText = async (text, config) => {
  if (!config || !config.apiKey) {
    throw new Error("AI not configured. Please add your API key in settings.");
  }

  const { protocol, apiKey, model, host, targetLanguage } = config;
  const key = deobfuscate(apiKey);

  try {
    if (protocol === AI_PROTOCOLS.OPENAI) {
      const baseUrl = host || "https://api.openai.com/v1";
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: model || "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a translator. Translate the following text to ${targetLanguage || "Spanish"}. Provide only the translation, no explanations.`,
            },
            { role: "user", content: text },
          ],
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error(
            `Server returned HTML (likely 404/500). Check your Host URL: ${baseUrl}`,
          );
        }
        const error = await response.json();
        throw new Error(
          error.error?.message || `API Error (${response.status})`,
        );
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    }

    if (protocol === AI_PROTOCOLS.GEMINI) {
      const baseUrl =
        host || "https://generativelanguage.googleapis.com/v1beta/models";
      const response = await fetch(
        `${baseUrl}/${model || "gemini-pro"}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Translate the following text to ${targetLanguage || "Spanish"}. Provide only the translation, no explanations: ${text}`,
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error(`Server returned HTML. Check your Host URL.`);
        }
        const error = await response.json();
        throw new Error(error.error?.message || "Gemini API Error");
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();
    }
  } catch (error) {
    console.error("Translation error:", error);
    if (error.name === "SyntaxError") {
      throw new Error(
        "Invalid response from server. Please check your Host URL and Protocol.",
      );
    }
    throw error;
  }

  throw new Error("Unsupported Protocol");
};

export const saveConfigLocal = (config) => {
  const obfuscatedConfig = {
    ...config,
    apiKey: obfuscate(config.apiKey),
  };
  localStorage.setItem("lexicon_ai_config", JSON.stringify(obfuscatedConfig));
};

export const getConfigLocal = () => {
  const config = localStorage.getItem("lexicon_ai_config");
  return config ? JSON.parse(config) : null;
};
