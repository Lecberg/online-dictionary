import {
  subscribeToAuthChanges,
  loginWithGoogle,
  loginWithGithub,
  loginWithEmail,
  registerWithEmail,
  logout,
} from "./services/auth";
import {
  saveToHistory,
  listenToHistory,
  addToFavorites,
  removeFromFavorites,
  listenToFavorites,
  syncHistoryToCloud,
  saveAIConfigs,
  getAIConfigs,
} from "./services/db";
import { fetchWordData } from "./services/dictionary";
import { translateText } from "./services/ai";
import {
  renderWordResult,
  renderHistoryItem,
  renderWOD,
  showToast,
} from "./components/UI";

// State
let currentUser = null;
let currentWordData = null;
let favoriteWords = [];
let dataUnsubscribers = [];
let aiConfigs = [];
let activeConfigIndex = -1;
let currentEditingIndex = -1;

// Initialize Lucide
const refreshIcons = () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
};

// --- Initialization ---

subscribeToAuthChanges((user) => {
  currentUser = user;
  updateAuthUI();

  dataUnsubscribers.forEach((unsub) => unsub?.());
  dataUnsubscribers = [];

  const uid = user ? user.uid : null;
  if (user) {
    syncHistoryToCloud(uid).then(() => setupDataListeners(uid));
  } else {
    setupDataListeners(null);
  }

  getAIConfigs(uid).then((configs) => {
    aiConfigs = configs;
    activeConfigIndex = configs.length > 0 ? 0 : -1;
    renderConfigTags();
  });

  refreshIcons();
});

initWOD();

// --- AI Configuration Management ---

function renderConfigTags() {
  elements.aiConfigItems.innerHTML = aiConfigs
    .map(
      (cfg, i) => `
    <div class="config-tag-wrapper" style="display: flex; align-items: center; gap: 0.3rem;">
        <button type="button" class="history-tag ${i === activeConfigIndex ? "active-config" : ""}" 
                data-index="${i}" style="${i === activeConfigIndex ? "background: var(--primary); color: white;" : ""}">
            ${cfg.name}
        </button>
        <span class="edit-config-icon" data-index="${i}" style="cursor:pointer; display: flex; align-items: center; color: var(--text-muted);">
          <i data-lucide="pencil" style="width: 14px; height: 14px;"></i>
        </span>
    </div>
  `,
    )
    .join("");

  document.querySelectorAll(".history-tag[data-index]").forEach((tag) => {
    tag.onclick = () => {
      activeConfigIndex = parseInt(tag.dataset.index);
      renderConfigTags();
      showToast(`Switched to ${aiConfigs[activeConfigIndex].name}`, "success");
    };
  });

  document.querySelectorAll(".edit-config-icon").forEach((icon) => {
    icon.onclick = () => {
      const idx = parseInt(icon.dataset.index);
      openEditor(idx);
    };
  });

  refreshIcons();
}

function openEditor(index = -1) {
  currentEditingIndex = index;
  elements.aiConfigEditor.classList.remove("hidden");

  if (index >= 0) {
    const cfg = aiConfigs[index];
    elements.aiConfigName.value = cfg.name;
    elements.aiProtocol.value = cfg.protocol;
    elements.aiApiKey.value = ""; // Don't show existing key
    elements.aiHost.value = cfg.host;
    elements.aiModel.value = cfg.model;
    elements.aiLanguage.value = cfg.targetLanguage;
    elements.deleteConfigBtn.classList.remove("hidden");
  } else {
    elements.aiSettingsForm.reset();
    elements.deleteConfigBtn.classList.add("hidden");
  }
}

elements.addNewConfigBtn.onclick = () => openEditor(-1);

elements.deleteConfigBtn.onclick = async () => {
  if (currentEditingIndex >= 0) {
    aiConfigs.splice(currentEditingIndex, 1);
    if (activeConfigIndex === currentEditingIndex) activeConfigIndex = -1;
    else if (activeConfigIndex > currentEditingIndex) activeConfigIndex--;

    await saveAIConfigs(currentUser ? currentUser.uid : null, aiConfigs);
    renderConfigTags();
    elements.aiConfigEditor.classList.add("hidden");
    showToast("Configuration deleted", "info");
  }
};

elements.aiSettingsForm.onsubmit = async (e) => {
  e.preventDefault();
  const newKey = elements.aiApiKey.value.trim();
  const existingKey =
    currentEditingIndex >= 0 ? aiConfigs[currentEditingIndex].apiKey : "";

  const config = {
    name: elements.aiConfigName.value.trim(),
    protocol: elements.aiProtocol.value,
    apiKey: newKey || existingKey,
    host: elements.aiHost.value.trim(),
    model: elements.aiModel.value.trim(),
    targetLanguage: elements.aiLanguage.value,
  };

  if (!config.apiKey) {
    showToast("API Key is required", "error");
    return;
  }

  if (currentEditingIndex >= 0) {
    aiConfigs[currentEditingIndex] = config;
  } else {
    aiConfigs.push(config);
    if (activeConfigIndex === -1) activeConfigIndex = 0;
  }

  try {
    await saveAIConfigs(currentUser ? currentUser.uid : null, aiConfigs);
    renderConfigTags();
    elements.aiConfigEditor.classList.add("hidden");
    showToast("Configuration saved!", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
};

// --- Auth Functions ---

function updateAuthUI() {
  if (currentUser) {
    elements.guestView.classList.add("hidden");
    elements.userView.classList.remove("hidden");
    elements.userName.textContent =
      currentUser.displayName || currentUser.email;
    elements.userAvatar.src =
      currentUser.photoURL ||
      "https://ui-avatars.com/api/?name=" + (currentUser.displayName || "User");
    elements.loginModal.classList.remove("active");
    elements.registerModal.classList.remove("active");
  } else {
    elements.guestView.classList.remove("hidden");
    elements.userView.classList.add("hidden");
  }
}

function setupDataListeners(uid) {
  const historyUnsub = listenToHistory(uid, (history) => {
    elements.historyList.innerHTML = history.length
      ? history.map(renderHistoryItem).join("")
      : '<p class="text-muted">No recent searches.</p>';

    document.querySelectorAll(".history-tag").forEach((tag) => {
      if (!tag.hasAttribute("data-index")) {
        tag.onclick = () => performSearch(tag.dataset.word);
      }
    });
    refreshIcons();
  });
  dataUnsubscribers.push(historyUnsub);

  if (uid) {
    const favUnsub = listenToFavorites(uid, (favorites) => {
      favoriteWords = favorites.map((f) => f.word.toLowerCase());
      elements.favoritesList.innerHTML = favorites.length
        ? favorites.map(renderHistoryItem).join("")
        : '<p class="text-muted">No favorites yet.</p>';

      updateFavoriteButton();

      document
        .querySelectorAll("#favoritesList .history-tag")
        .forEach((tag) => {
          tag.onclick = () => performSearch(tag.dataset.word);
        });
      refreshIcons();
    });
    dataUnsubscribers.push(favUnsub);
  } else {
    elements.favoritesList.innerHTML =
      '<p class="text-muted">Sign in to save favorites.</p>';
  }
}

// --- Search Logic ---

async function performSearch(word) {
  if (!word) return;
  elements.searchInput.value = word;
  elements.loader.classList.remove("hidden");
  elements.errorMsg.classList.add("hidden");
  elements.resultsSection.classList.add("hidden");

  try {
    const data = await fetchWordData(word);
    currentWordData = data[0];
    displayResults(data);
    saveToHistory(currentUser ? currentUser.uid : null, word);
  } catch (err) {
    elements.errorMsg.textContent = err.message;
    elements.errorMsg.classList.remove("hidden");
  } finally {
    elements.loader.classList.add("hidden");
  }
}

function displayResults(data) {
  const wordData = data[0];
  elements.resWord.textContent = wordData.word;
  elements.resPhonetic.textContent =
    wordData.phonetic || wordData.phonetics?.[0]?.text || "";
  elements.resMeanings.innerHTML = renderWordResult(data);
  elements.resultsSection.classList.remove("hidden");

  document.querySelectorAll(".translate-btn").forEach((btn, i) => {
    btn.onclick = async () => {
      const resultDiv = document.getElementById(`trans-${i}`);
      const originalText = btn.dataset.text;

      if (activeConfigIndex === -1) {
        showToast("Please configure AI settings first!", "info");
        elements.aiSettingsModal.classList.add("active");
        return;
      }

      try {
        btn.disabled = true;
        btn.innerHTML =
          '<i data-lucide="loader-2" class="spin" style="width: 14px; height: 14px;"></i>';
        refreshIcons();
        resultDiv.textContent = "Translating...";
        resultDiv.classList.remove("hidden");

        const translation = await translateText(
          originalText,
          aiConfigs[activeConfigIndex],
        );
        resultDiv.textContent = translation;
      } catch (err) {
        showToast(err.message, "error");
        resultDiv.classList.add("hidden");
      } finally {
        btn.disabled = false;
        btn.innerHTML =
          '<i data-lucide="sparkles" style="width: 14px; height: 14px;"></i>';
        refreshIcons();
      }
    };
  });

  updateFavoriteButton();
  refreshIcons();
  window.scrollTo({
    top: elements.resultsSection.offsetTop - 100,
    behavior: "smooth",
  });
}

function updateFavoriteButton() {
  if (!currentWordData) return;
  const isFav = favoriteWords.includes(currentWordData.word.toLowerCase());
  elements.toggleFavBtn.innerHTML = isFav
    ? '<i data-lucide="heart" style="fill: currentColor;"></i> Unfavorite'
    : '<i data-lucide="star"></i> Favorite';
  elements.toggleFavBtn.classList.toggle("btn-primary", isFav);
  refreshIcons();
}

// --- Event Listeners ---

elements.searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") performSearch(e.target.value.trim());
});

elements.searchBtn.onclick = () =>
  performSearch(elements.searchInput.value.trim());

elements.showLoginBtn.onclick = () =>
  elements.loginModal.classList.add("active");
elements.showRegisterBtn.onclick = () =>
  elements.registerModal.classList.add("active");
elements.toRegister.onclick = (e) => {
  e.preventDefault();
  elements.loginModal.classList.remove("active");
  elements.registerModal.classList.add("active");
};
elements.toLogin.onclick = (e) => {
  e.preventDefault();
  elements.registerModal.classList.remove("active");
  elements.loginModal.classList.add("active");
};

elements.showSettingsBtn.onclick = () => {
  renderConfigTags();
  elements.aiSettingsModal.classList.add("active");
};

elements.closeSettingsBtn.onclick = () => {
  elements.aiSettingsModal.classList.remove("active");
  elements.aiConfigEditor.classList.add("hidden");
};

elements.logoutBtn.onclick = logout;
elements.googleLoginBtn.onclick = loginWithGoogle;
elements.githubLoginBtn.onclick = loginWithGithub;

elements.loginForm.onsubmit = async (e) => {
  e.preventDefault();
  try {
    await loginWithEmail(
      elements.loginEmail.value,
      elements.loginPassword.value,
    );
    showToast("Logged in successfully", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
};

elements.registerForm.onsubmit = async (e) => {
  e.preventDefault();
  try {
    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const pass = document.getElementById("regPassword").value;
    await registerWithEmail(email, pass, name);
    showToast("Account created!", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
};

elements.toggleFavBtn.onclick = async () => {
  if (!currentUser) {
    elements.loginModal.classList.add("active");
    return;
  }
  if (!currentWordData) {
    showToast("Search for a word first!", "info");
    return;
  }
  const isFav = favoriteWords.includes(currentWordData.word.toLowerCase());
  if (isFav) {
    await removeFromFavorites(currentUser.uid, currentWordData.word);
    showToast("Removed from favorites", "info");
  } else {
    await addToFavorites(currentUser.uid, currentWordData);
    showToast("Added to favorites", "success");
  }
};

window.addEventListener("click", (e) => {
  if (e.target === elements.loginModal)
    elements.loginModal.classList.remove("active");
  if (e.target === elements.registerModal)
    elements.registerModal.classList.remove("active");
});

async function initWOD() {
  const WORD_LIST = [
    "serendipity",
    "ephemeral",
    "eloquent",
    "resilient",
    "paradigm",
    "ubiquitous",
    "pragmatic",
  ];
  const today = new Date().toDateString();
  let word = localStorage.getItem("wod_word");
  let date = localStorage.getItem("wod_date");

  if (date !== today) {
    word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    localStorage.setItem("wod_word", word);
    localStorage.setItem("wod_date", today);
  }

  try {
    const data = await fetchWordData(word);
    elements.wodContent.innerHTML = renderWOD(data);
    document.getElementById("viewWodBtn").onclick = () => performSearch(word);
  } catch (err) {
    elements.wodContent.innerHTML = "<p>Could not load Word of the Day.</p>";
  }
}
