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
} from "./services/db.js";
import { fetchWordData } from "./services/dictionary.js";
import {
  renderWordResult,
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

// DOM Elements
const elements = {
  authNav: document.getElementById("authNav"),
  guestView: document.getElementById("guestView"),
  userView: document.getElementById("userView"),
  userAvatar: document.getElementById("userAvatar"),
  userName: document.getElementById("userName"),
  logoutBtn: document.getElementById("logoutBtn"),

  showLoginBtn: document.getElementById("showLoginBtn"),
  showRegisterBtn: document.getElementById("showRegisterBtn"),
  loginModal: document.getElementById("loginModal"),
  registerModal: document.getElementById("registerModal"),

  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),

  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  regName: document.getElementById("regName"),
  regEmail: document.getElementById("regEmail"),
  regPassword: document.getElementById("regPassword"),
  toRegister: document.getElementById("toRegister"),
  toLogin: document.getElementById("toLogin"),

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
});

initWOD();

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

function displayResults(data) {
  const wordData = data[0];
  elements.resWord.textContent = wordData.word;
  elements.resPhonetic.textContent =
    wordData.phonetic || wordData.phonetics?.[0]?.text || "";
  elements.resMeanings.innerHTML = renderWordResult(data);
  elements.resultsSection.classList.remove("hidden");

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
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    elements.loginModal.classList.remove("active");
    elements.registerModal.classList.remove("active");
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
