export const renderWordResult = (data) => {
  const wordData = data[0];
  return wordData.meanings
    .map(
      (meaning) => `
        <div class="meaning-section">
            <div class="part-of-speech">${meaning.partOfSpeech}</div>
            ${meaning.definitions
              .map(
                (def, i) => `
                 <div class="definition-item">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <p><strong>${i + 1}.</strong> ${def.definition}</p>
                        <button class="translate-btn" data-text="${def.definition.replace(/"/g, "&quot;")}" title="Translate with AI">
                            🪄
                        </button>
                    </div>
                    ${def.example ? `<span class="example-text">"${def.example}"</span>` : ""}
                    <div class="translation-result hidden" id="trans-${i}"></div>
                </div>

            `,
              )
              .join("")}
        </div>
    `,
    )
    .join("");
};

export const renderHistoryItem = (item) => {
  return `<button class="history-tag" data-word="${item.word}">${item.word}</button>`;
};

export const renderWOD = (wordData) => {
  const word = wordData[0];
  const definition = word.meanings[0].definitions[0].definition;

  return `
        <h3 style="font-family: 'Playfair Display', serif; font-size: 2.2rem; margin-bottom: 0.5rem;">${word.word}</h3>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem; font-size: 1.1rem;">${definition}</p>
        <button class="btn btn-outline" id="viewWodBtn" data-word="${word.word}">Read Full Entry</button>
    `;
};

export const showToast = (message, type = "info") => {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed; bottom: 2rem; right: 2rem; padding: 0.8rem 1.5rem;
    background: #1a1a1a; color: white; font-size: 0.8rem;
    border-radius: 4px; z-index: 2000; letter-spacing: 0.02em;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};
