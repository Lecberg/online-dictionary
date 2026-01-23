export const renderWordResult = (data) => {
  const wordData = data[0];
  const meaningsHTML = wordData.meanings
    .map(
      (meaning) => `
        <div style="margin-top: 1.5rem">
            <h3 style="font-size: 1rem; text-transform: uppercase; color: var(--secondary)">${meaning.partOfSpeech}</h3>
            ${meaning.definitions
              .map(
                (def, i) => `
                <div style="margin: 0.8rem 0; padding-left: 1rem; border-left: 2px solid var(--primary)">
                    <p><strong>${i + 1}.</strong> ${def.definition}</p>
                    ${def.example ? `<p style="color: var(--text-muted); font-style: italic; font-size: 0.9rem">"${def.example}"</p>` : ""}
                </div>
            `,
              )
              .join("")}
        </div>
    `,
    )
    .join("");

  return meaningsHTML;
};

export const renderHistoryItem = (item) => {
  return `<button class="history-tag" data-word="${item.word}">${item.word}</button>`;
};

export const renderWOD = (wordData) => {
  const word = wordData[0];
  const definition = word.meanings[0].definitions[0].definition;

  return `
        <div class="wod-word">${word.word}</div>
        <div class="phonetic" style="color: white; opacity: 0.8; margin-bottom: 1rem">${word.phonetic || ""}</div>
        <p class="wod-definition">${definition}</p>
        <button class="btn btn-outline" style="background: white; color: var(--primary); margin-top: 1rem" id="viewWodBtn" data-word="${word.word}">Learn More</button>
    `;
};

export const showToast = (message, type = "info") => {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};
