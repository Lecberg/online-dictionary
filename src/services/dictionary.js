const API_BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

export const fetchWordData = async (word) => {
  const response = await fetch(`${API_BASE_URL}${word.toLowerCase()}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Word not found. Please check spelling and try again.");
    }
    throw new Error("Something went wrong. Please try again later.");
  }

  const data = await response.json();
  return data;
};
