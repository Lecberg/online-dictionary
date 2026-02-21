import spriteUrl from "../assets/icons/sprite.svg";

export const getSpritePath = () => spriteUrl;

export const iconSvg = (symbolId, extraClasses = "") => {
  const classes = ["icon", extraClasses].filter(Boolean).join(" ");
  const spritePath = getSpritePath();
  const fullPath = `${spritePath}#${symbolId}`;
  return `
    <svg class="${classes}" aria-hidden="true">
      <use href="${fullPath}" xlink:href="${fullPath}"></use>
    </svg>
  `.trim();
};

export const renderWordResult = (data) => {
  const wordData = data[0];
  const word = wordData.word.toLowerCase();
  return wordData.meanings
    .map(
      (meaning) => `
        <div class="meaning-section">
            <div class="part-of-speech">${meaning.partOfSpeech}</div>
            ${meaning.definitions
              .map(
                (def, i) => `
                 <div class="definition-item">
                    <p><strong>${i + 1}.</strong> ${def.definition}</p>
                    ${def.example ? `<span class="example-text">"${def.example}"</span>` : ""}
                </div>

            `,
              )
              .join("")}
        </div>
    `,
    )
    .join("");
};

export const renderHistoryItem = (
  item,
  iconSymbol = "icon-clock",
  cssVariant = "",
) => {
  const variantClass = cssVariant ? ` history-tag--${cssVariant}` : "";
  return `
    <button class="history-tag${variantClass}" data-word="${item.word}">
      ${iconSvg(iconSymbol, "icon--sm")}
      ${item.word}
    </button>
  `;
};

export const renderWOD = (wordData) => {
  const word = wordData[0];
  if (!word || !word.meanings || !word.meanings[0]?.definitions?.[0]) {
    return `<p>Could not load Word of the Day.</p>`;
  }

  const definition = word.meanings[0].definitions[0].definition;

  return `
        <h3 class="wod-word">${word.word}</h3>
        <p class="wod-definition">${definition}</p>
        <button class="btn btn-outline" id="viewWodBtn" data-word="${word.word}">
          ${iconSvg("icon-book", "icon--sm")}
          Read Full Entry
        </button>
    `;
};

export const showToast = (message, type = "info") => {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed; bottom: 2rem; right: 2rem; padding: 1rem 1.5rem;
    background: var(--surface); backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px); color: var(--text-main); font-size: 0.9rem;
    border-radius: var(--radius-sm); z-index: 2000; box-shadow: var(--shadow-hover);
    border: 1px solid var(--border); font-weight: 500;
    animation: toastIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "toastOut 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};
