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
                        <button type="button" class="translate-btn" data-text="${def.definition.replace(/"/g, "&quot;")}" data-icon="icon-wand" title="Translate with AI" aria-label="Translate definition">
                            <svg class="icon icon--sm" aria-hidden="true">
                                <use href="/src/assets/icons/sprite.svg#icon-wand"></use>
                            </svg>
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

// Simple markdown parser
const parseMarkdown = (text) => {
  if (!text) return "";

  let html = text
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headers
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    // Bold and Italic
    .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/___(.*?)___/g, "<strong><em>$1</em></strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    // Code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Blockquotes
    .replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>")
    // Lists
    .replace(/^\- (.*$)/gim, "<li>$1</li>")
    .replace(/^\* (.*$)/gim, "<li>$1</li>")
    .replace(/^\d+\. (.*$)/gim, "<li>$1</li>")
    // Links
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>',
    )
    // Line breaks
    .replace(/\n/g, "<br>");

  // Wrap consecutive li elements in ul/ol
  html = html.replace(/(<li>.*?<\/li>)+/g, (match) => {
    const isOrdered = /^\d+/.test(
      text.substring(text.indexOf(match) - 10, text.indexOf(match)),
    );
    const tag = isOrdered ? "ol" : "ul";
    return `<${tag}>${match}</${tag}>`;
  });

  // Wrap consecutive blockquotes
  html = html.replace(/(<blockquote>.*?<\/blockquote>)+/g, (match) => {
    return `<div class="quote-block">${match}</div>`;
  });

  return html;
};

export const renderAIResult = (word, definition, configName) => {
  return `
        <div class="ai-generated-section">
            <div class="ai-badge">
                <svg class="icon icon--sm" aria-hidden="true">
                    <use href="/src/assets/icons/sprite.svg#icon-robot"></use>
                </svg>
                AI Generated (${configName})
            </div>
            <div class="ai-content markdown-body">
                ${parseMarkdown(definition)}
            </div>
        </div>
    `;
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
    position: fixed; bottom: 2rem; right: 2rem; padding: 1rem 2rem;
    background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px); color: var(--text-main); font-size: 0.9rem;
    border-radius: 50px; z-index: 2000; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    border: 1px solid var(--border); font-weight: 600;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};
