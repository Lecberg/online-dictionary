import {
  subscribeToAuthChanges,
  loginWithGoogle,
  loginWithGithub,
  loginWithEmail,
  registerWithEmail,
  logout,
} from "./services/auth.js";
import {
  saveToHistory,
  listenToHistory,
  addToFavorites,
  removeFromFavorites,
  listenToFavorites,
  syncHistoryToCloud,
  saveAIConfigs,
  getAIConfigs,
} from "./services/db.js";
import { fetchWordData } from "./services/dictionary.js";
import { translateText, generateWordDefinition } from "./services/ai.js";
import {
  fetchAvailableModels,
  getModelsCache,
  clearModelsCache,
} from "./services/fetchmodels.js";
import {
  renderWordResult,
  renderAIResult,
  renderHistoryItem,
  renderWOD,
  showToast,
  iconSvg,
  getSpritePath,
} from "./components/UI.js";

// State
let currentUser = null;
let currentWordData = null;
let favoriteWords = [];
let dataUnsubscribers = [];
let aiConfigs = [];
let activeConfigIndex = -1;
let currentEditingIndex = -1;

// DOM Elements
const elements = {
  authNav: document.getElementById("authNav"),
  guestView: document.getElementById("guestView"),
  userView: document.getElementById("userView"),
  userAvatar: document.getElementById("userAvatar"),
  userName: document.getElementById("userName"),
  logoutBtn: document.getElementById("logoutBtn"),
  showSettingsBtn: document.getElementById("showSettingsBtn"),

  showLoginBtn: document.getElementById("showLoginBtn"),
  showRegisterBtn: document.getElementById("showRegisterBtn"),
  loginModal: document.getElementById("loginModal"),
  registerModal: document.getElementById("registerModal"),
  aiSettingsModal: document.getElementById("aiSettingsModal"),

  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  aiSettingsForm: document.getElementById("aiSettingsForm"),

  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  regName: document.getElementById("regName"),
  regEmail: document.getElementById("regEmail"),
  regPassword: document.getElementById("regPassword"),
  toRegister: document.getElementById("toRegister"),
  toLogin: document.getElementById("toLogin"),

  aiConfigItems: document.getElementById("aiConfigItems"),
  addNewConfigBtn: document.getElementById("addNewConfigBtn"),
  aiConfigEditor: document.getElementById("aiConfigEditor"),
  aiEditorEmptyState: document.getElementById("aiEditorEmptyState"),
  startNewConfigBtn: document.getElementById("startNewConfigBtn"),
  aiConfigName: document.getElementById("aiConfigName"),
  aiProtocol: document.getElementById("aiProtocol"),
  aiApiKey: document.getElementById("aiApiKey"),
  aiHost: document.getElementById("aiHost"),
  aiModel: document.getElementById("aiModel"),
  aiLanguage: document.getElementById("aiLanguage"),
  refreshModelsBtn: document.getElementById("refreshModelsBtn"),
  modelsDropdown: document.getElementById("modelsDropdown"),
  modelLoading: document.getElementById("modelLoading"),
  modelInfo: document.getElementById("modelInfo"),
  deleteConfigBtn: document.getElementById("deleteConfigBtn"),
  aiEditorModeLabel: document.getElementById("aiEditorModeLabel"),
  aiEditorTitle: document.getElementById("aiEditorTitle"),
  aiEditorSubtitle: document.getElementById("aiEditorSubtitle"),
  cancelEditorBtn: document.getElementById("cancelEditorBtn"),
  aiSettingsMessage: document.getElementById("aiSettingsMessage"),
  testAiConfigBtn: document.getElementById("testAiConfigBtn"),
  activeConfigSummary: document.getElementById("activeConfigSummary"),
  closeSettingsBtn: document.getElementById("closeSettingsBtnTop"),

  googleLoginBtn: document.getElementById("googleLoginBtn"),
  githubLoginBtn: document.getElementById("githubLoginBtn"),

  searchInput: document.getElementById("searchInput"),
  loader: document.getElementById("loader"),
  errorMsg: document.getElementById("errorMsg"),
  resultsSection: document.getElementById("resultsSection"),
  resWord: document.getElementById("resWord"),
  resPhonetic: document.getElementById("resPhonetic"),
  resMeanings: document.getElementById("resMeanings"),
  toggleFavBtn: document.getElementById("toggleFavBtn"),
  searchBtn: document.getElementById("searchBtn"),
  aiGenerateBtn: document.getElementById("aiGenerateBtn"),

  historyList: document.getElementById("historyList"),
  favoritesList: document.getElementById("favoritesList"),
  wodContent: document.getElementById("wodContent"),
};

// --- Initialization ---

subscribeToAuthChanges(async (user) => {
  currentUser = user;
  updateAuthUI();

  dataUnsubscribers.forEach((unsub) => unsub?.());
  dataUnsubscribers = [];

  const uid = user ? user.uid : null;
  if (user) {
    await syncHistoryToCloud(uid);
    setupDataListeners(uid);

    if (pendingWordData) {
      currentWordData = pendingWordData;
      await addToFavorites(uid, currentWordData);
      favoriteWords.push(currentWordData.word.toLowerCase());
      updateFavoriteButton();
      pendingWordData = null;
      showToast("Added pending word to favorites", "success");
    }
  } else {
    setupDataListeners(null);
  }

  getAIConfigs(uid).then((configs) => {
    aiConfigs = configs;
    activeConfigIndex = configs.length > 0 ? 0 : -1;
    renderConfigTags();
  });
});

initWOD();

// --- AI Configuration Management ---

function setStatusMessage(message, type = "success") {
  if (!message) {
    elements.aiSettingsMessage.classList.add("hidden");
    elements.aiSettingsMessage.textContent = "";
    elements.aiSettingsMessage.classList.remove("error");
    return;
  }
  elements.aiSettingsMessage.textContent = message;
  elements.aiSettingsMessage.classList.toggle("error", type === "error");
  elements.aiSettingsMessage.classList.remove("hidden");
}

function updateActiveSummary() {
  if (activeConfigIndex < 0 || !aiConfigs[activeConfigIndex]) {
    elements.activeConfigSummary.innerHTML = `
      <p class="eyebrow-label">Active configuration</p>
      <h3>No configuration selected</h3>
      <p class="text-muted small-text">Select or create a configuration to translate definitions.</p>
    `;
    elements.testAiConfigBtn.disabled = true;
    return;
  }

  const cfg = aiConfigs[activeConfigIndex];
  elements.activeConfigSummary.innerHTML = `
    <p class="eyebrow-label">Active configuration</p>
    <h3>${cfg.name}</h3>
    <p class="text-muted small-text">${cfg.protocol.toUpperCase()} • ${cfg.model || "Model not set"} • ${cfg.targetLanguage}</p>
  `;
  elements.testAiConfigBtn.disabled = false;
}

function renderConfigTags() {
  if (!aiConfigs.length) {
    elements.aiConfigItems.innerHTML = `<p class="text-muted">No providers saved yet.</p>`;
    updateActiveSummary();
    return;
  }

  elements.aiConfigItems.innerHTML = aiConfigs
    .map((cfg, i) => {
      const isActive = i === activeConfigIndex;
      return `
        <div class="config-row ${isActive ? "active" : ""}">
          <div class="config-meta">
            <strong>${cfg.name}</strong>
            <span class="small-text text-muted">${cfg.protocol.toUpperCase()} • ${cfg.targetLanguage}</span>
          </div>
          <div class="config-actions">
            <button
              type="button"
              class="btn btn-outline btn-sm select-config-btn"
              data-index="${i}"
              ${isActive ? "aria-pressed='true'" : ""}
            >
              ${isActive ? "Active" : "Set active"}
            </button>
            <button
              type="button"
              class="icon-button edit-config-btn"
              data-index="${i}"
              aria-label="Edit ${cfg.name} configuration"
            >
              ${iconSvg("icon-pencil", "icon--sm")}
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".select-config-btn").forEach((btn) => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.index);
      if (activeConfigIndex === idx) return;
      activeConfigIndex = idx;
      renderConfigTags();
      updateActiveSummary();
      setStatusMessage(`Switched to ${aiConfigs[activeConfigIndex].name}`);
    };
  });

  document.querySelectorAll(".edit-config-btn").forEach((iconBtn) => {
    iconBtn.onclick = (e) => {
      e.stopPropagation();
      const idx = parseInt(iconBtn.dataset.index);
      openEditor(idx);
    };
  });

  updateActiveSummary();
}

function toggleEditorVisibility(show) {
  elements.aiConfigEditor.classList.toggle("hidden", !show);
  elements.aiEditorEmptyState.classList.toggle("hidden", show);
}

function openEditor(index = -1) {
  currentEditingIndex = index;
  toggleEditorVisibility(true);

  if (index >= 0) {
    const cfg = aiConfigs[index];
    elements.aiConfigName.value = cfg.name;
    elements.aiProtocol.value = cfg.protocol;
    elements.aiApiKey.value = "";
    elements.aiHost.value = cfg.host;
    elements.aiModel.value = cfg.model;
    elements.aiLanguage.value = cfg.targetLanguage;
    elements.deleteConfigBtn.classList.remove("hidden");
    elements.aiEditorModeLabel.textContent = "Editing configuration";
    elements.aiEditorTitle.textContent = cfg.name;
    elements.aiEditorSubtitle.textContent = `${cfg.protocol.toUpperCase()} • ${cfg.targetLanguage}`;

    if (cfg.host && cfg.apiKey) {
      const cached = getModelsCache(cfg.host);
      if (cached && cached.length > 0) {
        populateModelDropdown(cached);
        elements.modelInfo.textContent = `✓ Loaded ${cached.length} cached models`;
      } else {
        fetchAvailableModels(cfg)
          .then(({ models, source }) => {
            if (models.length > 0) {
              populateModelDropdown(models);
              elements.modelInfo.textContent =
                source === "cache"
                  ? `✓ Loaded ${models.length} cached models`
                  : `✓ Fetched ${models.length} models`;
            }
          })
          .catch((err) => {
            console.error("Auto-fetch models failed:", err);
            elements.modelInfo.textContent = "⚠ Could not load models";
          });
      }
    }
  } else {
    elements.aiSettingsForm.reset();
    elements.deleteConfigBtn.classList.add("hidden");
    elements.aiEditorModeLabel.textContent = "New configuration";
    elements.aiEditorTitle.textContent = "Create AI preset";
    elements.aiEditorSubtitle.textContent =
      "Define provider details and language target";
  }
}

function closeEditor() {
  currentEditingIndex = -1;
  toggleEditorVisibility(false);
  elements.aiSettingsForm.reset();
}

elements.addNewConfigBtn.onclick = () => openEditor(-1);
elements.startNewConfigBtn.onclick = () => openEditor(-1);
elements.cancelEditorBtn.onclick = closeEditor;

elements.testAiConfigBtn.onclick = async () => {
  if (activeConfigIndex === -1) {
    setStatusMessage("Select a configuration first", "error");
    return;
  }

  const config = aiConfigs[activeConfigIndex];

  if (!config.apiKey || !config.apiKey.trim()) {
    setStatusMessage("API Key is required", "error");
    return;
  }

  if (!config.model || !config.model.trim()) {
    setStatusMessage("Model is required", "error");
    return;
  }

  try {
    elements.testAiConfigBtn.disabled = true;
    elements.testAiConfigBtn.textContent = "Testing…";
    await translateText("This is a test sentence.", config);
    setStatusMessage("Connection looks good!", "success");
  } catch (err) {
    setStatusMessage(err.message, "error");
  } finally {
    elements.testAiConfigBtn.textContent = "Test translation";
    elements.testAiConfigBtn.disabled = false;
  }
};

function populateModelDropdown(models) {
  const currentValue = elements.aiModel.value;

  elements.modelsDropdown.innerHTML = `
    <option value="" disabled selected>Select a model...</option>
  `;

  if (models.length === 0) {
    elements.modelsDropdown.innerHTML += `
      <option value="" disabled style="color: var(--text-muted)">
        No models available - enter manually
      </option>
    `;
    return;
  }

  models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model.id;
    option.textContent = model.name || model.id;
    if (model.id === currentValue) {
      option.selected = true;
    }
    elements.modelsDropdown.appendChild(option);
  });
}

elements.refreshModelsBtn.onclick = async () => {
  const currentConfig = aiConfigs[activeConfigIndex] || {
    protocol: elements.aiProtocol.value,
    host: elements.aiHost.value,
    apiKey: elements.aiApiKey.value,
  };

  if (!currentConfig.apiKey) {
    showToast("API Key is required to fetch models", "error");
    setStatusMessage("API Key is required to fetch models", "error");
    return;
  }

  if (!currentConfig.host) {
    showToast("Host URL is required to fetch models", "error");
    setStatusMessage("Host URL is required to fetch models", "error");
    return;
  }

  try {
    elements.refreshModelsBtn.disabled = true;
    elements.modelLoading.classList.remove("hidden");
    elements.modelsDropdown.disabled = true;

    const { models, source } = await fetchAvailableModels(currentConfig);

    populateModelDropdown(models);

    elements.modelInfo.textContent =
      source === "cache"
        ? `✓ Loaded ${models.length} cached models`
        : `✓ Fetched ${models.length} models`;

    if (models.length > 0 && !elements.aiModel.value) {
      elements.aiModel.value = elements.modelsDropdown.value || models[0].id;
    }

    showToast(`Loaded ${models.length} available models`, "success");
    setStatusMessage(`Loaded ${models.length} available models`, "success");
  } catch (error) {
    console.error("Fetch models error:", error);
    showToast(error.message, "error");
    setStatusMessage(error.message, "error");
    elements.modelInfo.textContent = "⚠ Error fetching models";
  } finally {
    elements.refreshModelsBtn.disabled = false;
    elements.modelLoading.classList.add("hidden");
    elements.modelsDropdown.disabled = false;
  }
};

elements.modelsDropdown.onchange = () => {
  elements.aiModel.value = elements.modelsDropdown.value;
};

elements.deleteConfigBtn.onclick = async () => {
  if (currentEditingIndex < 0) return;
  aiConfigs.splice(currentEditingIndex, 1);
  if (activeConfigIndex === currentEditingIndex) activeConfigIndex = -1;
  else if (activeConfigIndex > currentEditingIndex) activeConfigIndex--;

  try {
    await saveAIConfigs(currentUser ? currentUser.uid : null, aiConfigs);
    renderConfigTags();
    closeEditor();
    setStatusMessage("Configuration deleted", "success");
    showToast("Configuration deleted", "info");
  } catch (err) {
    setStatusMessage(err.message, "error");
    showToast(err.message, "error");
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

  if (!config.model || !config.model.trim()) {
    showToast("Model is required", "error");
    setStatusMessage("Model is required", "error");
    return;
  }

  if (currentEditingIndex >= 0) {
    aiConfigs[currentEditingIndex] = config;
  } else {
    aiConfigs.push(config);
    if (activeConfigIndex === -1) activeConfigIndex = 0;
  }

  try {
    elements.aiSettingsForm.classList.add("is-submitting");
    await saveAIConfigs(currentUser ? currentUser.uid : null, aiConfigs);
    renderConfigTags();
    updateActiveSummary();
    closeEditor();
    setStatusMessage("Configuration saved!", "success");
    showToast("Configuration saved!", "success");
  } catch (err) {
    setStatusMessage(err.message, "error");
    showToast(err.message, "error");
  } finally {
    elements.aiSettingsForm.classList.remove("is-submitting");
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
      ? history
          .map((item) => renderHistoryItem(item, "icon-clock", "history"))
          .join("")
      : '<p class="text-muted">No recent searches.</p>';

    document.querySelectorAll(".history-tag").forEach((tag) => {
      tag.onclick = () => performSearch(tag.dataset.word);
    });
  });
  dataUnsubscribers.push(historyUnsub);

  if (uid) {
    const favUnsub = listenToFavorites(uid, (favorites) => {
      favoriteWords = favorites.map((f) => f.word.toLowerCase());
      elements.favoritesList.innerHTML = favorites.length
        ? favorites
            .map((item) => renderHistoryItem(item, "icon-heart", "favorite"))
            .join("")
        : '<p class="text-muted">No favorites yet.</p>';

      updateFavoriteButton();

      document
        .querySelectorAll("#favoritesList .history-tag")
        .forEach((tag) => {
          tag.onclick = () => performSearch(tag.dataset.word);
        });
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

async function handleAIGenerate() {
  const word = elements.searchInput.value.trim();
  if (!word) {
    showToast("Please enter a word first", "info");
    return;
  }

  if (activeConfigIndex === -1 || !aiConfigs[activeConfigIndex]) {
    showToast("Please configure AI settings first!", "info");
    renderConfigTags();
    elements.aiSettingsModal.classList.add("active");
    document.body.classList.add("modal-open");
    return;
  }

  const config = aiConfigs[activeConfigIndex];

  if (!config.apiKey || !config.apiKey.trim()) {
    showToast(
      "API Key is required! Please configure it in AI Settings.",
      "error",
    );
    renderConfigTags();
    elements.aiSettingsModal.classList.add("active");
    document.body.classList.add("modal-open");
    return;
  }

  if (!config.protocol || !config.protocol.trim()) {
    showToast(
      "Protocol is required! Please configure it in AI Settings.",
      "error",
    );
    renderConfigTags();
    elements.aiSettingsModal.classList.add("active");
    document.body.classList.add("modal-open");
    return;
  }

  const aiBtn = elements.aiGenerateBtn;
  const originalHtml = aiBtn.innerHTML;

  try {
    aiBtn.disabled = true;
    aiBtn.innerHTML = `${iconSvg("icon-spinner", "icon--sm")} thinking...`;

    elements.loader.textContent = "AI is thinking...";
    elements.loader.classList.remove("hidden");
    elements.errorMsg.classList.add("hidden");

    const definition = await generateWordDefinition(word, config);

    // If showing results for a different word or section is hidden, reset for new word
    const isNewWord =
      elements.resWord.textContent.toLowerCase() !== word.toLowerCase();
    if (elements.resultsSection.classList.contains("hidden") || isNewWord) {
      elements.resWord.textContent = word;
      elements.resPhonetic.textContent = "AI Generated Entry";
      elements.resMeanings.innerHTML = "";
      elements.resultsSection.classList.remove("hidden");
    }

    // Append AI result
    elements.resMeanings.innerHTML += renderAIResult(
      word,
      definition,
      config.name,
    );

    saveToHistory(currentUser ? currentUser.uid : null, word);

    window.scrollTo({
      top: elements.resultsSection.offsetTop - 100,
      behavior: "smooth",
    });
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    aiBtn.disabled = false;
    aiBtn.innerHTML = originalHtml;
    elements.loader.textContent = "Searching...";
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

  document.querySelectorAll(".translate-btn").forEach((btn) => {
    const defaultIconId = btn.dataset.icon || "icon-wand";
    btn.onclick = async () => {
      const word = btn.dataset.word;
      const index = btn.dataset.index;
      const resultDiv = document.getElementById(`trans-${word}-${index}`);
      const originalText = btn.dataset.text;

      if (activeConfigIndex === -1) {
        showToast("Please configure AI settings first!", "info");
        elements.aiSettingsModal.classList.add("active");
        return;
      }

      try {
        const config = aiConfigs[activeConfigIndex];

        if (!config.apiKey || !config.apiKey.trim()) {
          showToast(
            "API Key is required! Please configure it in AI Settings.",
            "error",
          );
          return;
        }

        if (!config.model || !config.model.trim()) {
          showToast(
            "Model is required! Please configure it in AI Settings.",
            "error",
          );
          return;
        }

        btn.disabled = true;
        btn.classList.add("is-loading");
        btn
          .querySelector("use")
          ?.setAttribute("href", `${getSpritePath()}#icon-spinner`);
        resultDiv.textContent = "Translating...";
        resultDiv.classList.remove("hidden");

        const result = await translateText(originalText, config);

        const { translation, cached, modelUsed, fallback } = result;

        if (cached) {
          resultDiv.innerHTML = `
            ${translation}
            <span class="cache-indicator" title="Loaded from cache (instant)">
              ${iconSvg("icon-check-circle")} Cached
            </span>
          `;
        } else {
          resultDiv.textContent = translation;
          if (fallback) {
            resultDiv.innerHTML += `
              <span class="cache-indicator fallback" title="Fallback model used">
                ${iconSvg("icon-info-circle")} Used fast model
              </span>
            `;
          }
        }
      } catch (err) {
        showToast(err.message, "error");
        resultDiv.classList.add("hidden");
      } finally {
        btn.disabled = false;
        btn.classList.remove("is-loading");
        btn
          .querySelector("use")
          ?.setAttribute("href", `${getSpritePath()}#${defaultIconId}`);
      }
    };
  });

  updateFavoriteButton();
  window.scrollTo({
    top: elements.resultsSection.offsetTop - 100,
    behavior: "smooth",
  });
}

function updateFavoriteButton() {
  if (!currentWordData) return;
  const isFav = favoriteWords.includes(currentWordData.word.toLowerCase());
  const iconId = isFav ? "icon-heart" : "icon-star";
  const label = isFav ? "Unfavorite" : "Favorite";
  elements.toggleFavBtn.innerHTML = `${iconSvg(iconId)}<span class="btn-label">${label}</span>`;
  elements.toggleFavBtn.classList.toggle("btn-primary", isFav);
  elements.toggleFavBtn.classList.toggle("btn-outline", !isFav);
  elements.toggleFavBtn.setAttribute("aria-pressed", isFav);
}

// --- Event Listeners ---

elements.searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") performSearch(e.target.value.trim());
});

elements.searchBtn.onclick = () =>
  performSearch(elements.searchInput.value.trim());

elements.aiGenerateBtn.onclick = () => handleAIGenerate();

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
  document.body.classList.add("modal-open");
};

function closeAiSettingsModal() {
  elements.aiSettingsModal.classList.remove("active");
  toggleEditorVisibility(false);
  setStatusMessage("");
  document.body.classList.remove("modal-open");
}

elements.closeSettingsBtn.onclick = closeAiSettingsModal;

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

let pendingWordData = null;

elements.toggleFavBtn.onclick = async () => {
  if (!currentUser) {
    pendingWordData = currentWordData;
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
    favoriteWords = favoriteWords.filter(
      (w) => w !== currentWordData.word.toLowerCase(),
    );
    showToast("Removed from favorites", "info");
  } else {
    await addToFavorites(currentUser.uid, currentWordData);
    favoriteWords.push(currentWordData.word.toLowerCase());
    showToast("Added to favorites", "success");
  }
  updateFavoriteButton();
};

window.addEventListener("click", (e) => {
  if (e.target === elements.loginModal)
    elements.loginModal.classList.remove("active");
  if (e.target === elements.registerModal)
    elements.registerModal.classList.remove("active");
  if (e.target === elements.aiSettingsModal) closeAiSettingsModal();
});

document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    elements.aiSettingsModal.classList.contains("active")
  ) {
    closeAiSettingsModal();
  }
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
    const viewWodBtn = document.getElementById("viewWodBtn");
    if (viewWodBtn) {
      viewWodBtn.onclick = () => performSearch(word);
    }
  } catch (err) {
    elements.wodContent.innerHTML = "<p>Could not load Word of the Day.</p>";
  }
}
