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
  saveAIConfig,
  getAIConfig,
} from "./services/db";
import { fetchWordData } from "./services/dictionary";
import { translateText, AI_PROVIDERS } from "./services/ai";
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
let aiConfig = null;

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

  aiProtocol: document.getElementById("aiProtocol"),
  aiApiKey: document.getElementById("aiApiKey"),
  aiHost: document.getElementById("aiHost"),
  aiModel: document.getElementById("aiModel"),
  aiLanguage: document.getElementById("aiLanguage"),
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

  historyList: document.getElementById("historyList"),
  favoritesList: document.getElementById("favoritesList"),
  wodContent: document.getElementById("wodContent"),
};

// --- Initialization ---

subscribeToAuthChanges((user) => {
  currentUser = user;
  updateAuthUI();

  // Clean up previous listeners
  dataUnsubscribers.forEach((unsub) => unsub?.());
  dataUnsubscribers = [];

  if (user) {
    // Sync local guest history to the logged-in account
    syncHistoryToCloud(user.uid).then(() => {
      setupDataListeners(user.uid);
    });
    // Load AI Config
    getAIConfig(user.uid).then((config) => {
      aiConfig = config;
    });
  } else {
    setupDataListeners(null);
    getAIConfig(null).then((config) => {
      aiConfig = config;
    });
  }
});

initWOD();

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

    // Add click listeners to history tags
    document.querySelectorAll(".history-tag").forEach((tag) => {
      tag.onclick = () => performSearch(tag.dataset.word);
    });
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

  // Attach translation listeners
  document.querySelectorAll(".translate-btn").forEach((btn, i) => {
    btn.onclick = async () => {
      const resultDiv = document.getElementById(`trans-${i}`);
      const originalText = btn.dataset.text;

      if (!aiConfig || !aiConfig.apiKey) {
        showToast("Please configure AI settings first!", "info");
        elements.aiSettingsModal.classList.add("active");
        return;
      }

      try {
        btn.disabled = true;
        btn.textContent = "⌛";
        resultDiv.textContent = "Translating...";
        resultDiv.classList.remove("hidden");

        const translation = await translateText(originalText, aiConfig);
        resultDiv.textContent = translation;
      } catch (err) {
        showToast(err.message, "error");
        resultDiv.classList.add("hidden");
      } finally {
        btn.disabled = false;
        btn.textContent = "🪄";
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
  elements.toggleFavBtn.innerHTML = isFav ? "❤️ Unfavorite" : "⭐ Favorite";
  elements.toggleFavBtn.classList.toggle("btn-primary", isFav);
}

// --- Event Listeners ---

elements.searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") performSearch(e.target.value.trim());
});

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

// Close modals on outside click
window.onclick = (e) => {
  if (e.target === elements.loginModal)
    elements.loginModal.classList.remove("active");
  if (e.target === elements.registerModal)
    elements.registerModal.classList.remove("active");
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

// --- AI Settings Logic ---

elements.showSettingsBtn.onclick = () => {
  if (aiConfig) {
    elements.aiProtocol.value = aiConfig.protocol || "openai";
    elements.aiApiKey.value = ""; // Clear for new input, keep existing if empty
    elements.aiHost.value = aiConfig.host || "";
    elements.aiModel.value = aiConfig.model || "";
    elements.aiLanguage.value = aiConfig.targetLanguage || "Spanish";
  }
  elements.aiSettingsModal.classList.add("active");
};

elements.closeSettingsBtn.onclick = () => {
  elements.aiSettingsModal.classList.remove("active");
};

elements.aiSettingsForm.onsubmit = async (e) => {
  e.preventDefault();

  // Use existing key if new one isn't provided
  const newKey = elements.aiApiKey.value.trim();
  const config = {
    protocol: elements.aiProtocol.value,
    apiKey: newKey || (aiConfig ? aiConfig.apiKey : ""),
    host: elements.aiHost.value.trim(),
    model: elements.aiModel.value.trim(),
    targetLanguage: elements.aiLanguage.value,
  };

  if (!config.apiKey && !newKey) {
    showToast("API Key is required", "error");
    return;
  }

  try {
    await saveAIConfig(currentUser ? currentUser.uid : null, config);
    aiConfig = config;
    showToast("AI Configuration Updated!", "success");
    // Modal stays open until close button is clicked (as requested)
  } catch (err) {
    showToast(err.message, "error");
  }
};

// Close modals on outside click (Auth only, AI modal requires button)
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
