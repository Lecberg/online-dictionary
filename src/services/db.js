import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Local Storage Helpers for Guest Users
 */
const LOCAL_HISTORY_KEY = "lexicon_history";
const LOCAL_AI_CONFIG_KEY = "lexicon_ai_config";
const MAX_HISTORY = 10;

/**
 * Save AI Configuration
 */
export const saveAIConfig = async (uid, config) => {
  if (!uid) {
    localStorage.setItem(LOCAL_AI_CONFIG_KEY, JSON.stringify(config));
    return;
  }
  const configRef = doc(db, "users", uid, "settings", "aiConfig");
  await setDoc(configRef, {
    ...config,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Get AI Configuration
 */
export const getAIConfig = async (uid) => {
  if (!uid) {
    const local = localStorage.getItem(LOCAL_AI_CONFIG_KEY);
    return local ? JSON.parse(local) : null;
  }
  const configRef = doc(db, "users", uid, "settings", "aiConfig");
  const docSnap = await getDoc(configRef);
  return docSnap.exists() ? docSnap.data() : null;
};

const getLocalHistory = () => {
  const data = localStorage.getItem(LOCAL_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
};

/**
 * Sync local history to Firestore
 */
export const syncHistoryToCloud = async (uid) => {
  const localHistory = getLocalHistory();
  if (!uid || localHistory.length === 0) return;

  for (const item of localHistory) {
    await saveToHistory(uid, item.word);
  }
  // Clear local history after sync
  localStorage.removeItem(LOCAL_HISTORY_KEY);
};

/**
 * Save a word to user's search history
 */
export const saveToHistory = async (uid, word) => {
  const wordLower = word.toLowerCase();

  if (!uid) {
    // Guest user: save to localStorage
    let history = getLocalHistory();
    history = history.filter((item) => item.word !== wordLower);
    history.unshift({ word: wordLower, timestamp: Date.now() });
    localStorage.setItem(
      LOCAL_HISTORY_KEY,
      JSON.stringify(history.slice(0, MAX_HISTORY)),
    );
    return;
  }

  const historyRef = doc(db, "users", uid, "searchHistory", wordLower);
  await setDoc(historyRef, {
    word: wordLower,
    timestamp: serverTimestamp(),
  });
};

/**
 * Get real-time updates for search history
 */
export const listenToHistory = (uid, callback) => {
  if (!uid) {
    // Guest user: send initial local history
    callback(getLocalHistory());

    // Listen for storage changes in other tabs
    const handleStorageChange = (e) => {
      if (e.key === LOCAL_HISTORY_KEY) callback(getLocalHistory());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }

  const historyRef = collection(db, "users", uid, "searchHistory");
  const q = query(historyRef, orderBy("timestamp", "desc"), limit(MAX_HISTORY));

  return onSnapshot(
    q,
    (snapshot) => {
      const history = [];
      snapshot.forEach((doc) => history.push(doc.data()));
      callback(history);
    },
    (error) => {
      console.error("Firestore History Error:", error);
    },
  );
};

/**
 * Add a word to favorites
 */
export const addToFavorites = async (uid, wordData) => {
  if (!uid) return;
  const favRef = doc(
    db,
    "users",
    uid,
    "favorites",
    wordData.word.toLowerCase(),
  );
  await setDoc(favRef, {
    ...wordData,
    timestamp: serverTimestamp(),
  });
};

/**
 * Remove a word from favorites
 */
export const removeFromFavorites = async (uid, word) => {
  if (!uid) return;
  const favRef = doc(db, "users", uid, "favorites", word.toLowerCase());
  await deleteDoc(favRef);
};

/**
 * Get real-time updates for favorites
 */
export const listenToFavorites = (uid, callback) => {
  if (!uid) return null;
  const favRef = collection(db, "users", uid, "favorites");
  const q = query(favRef, orderBy("timestamp", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const favorites = [];
      snapshot.forEach((doc) => favorites.push(doc.data()));
      callback(favorites);
    },
    (error) => {
      console.error("Firestore Favorites Error:", error);
    },
  );
};
