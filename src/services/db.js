import {
  doc,
  setDoc,
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
const MAX_HISTORY = 10;

const getLocalHistory = () => {
  const data = localStorage.getItem(LOCAL_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
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

  return onSnapshot(q, (snapshot) => {
    const history = [];
    snapshot.forEach((doc) => history.push(doc.data()));
    callback(history);
  });
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

  return onSnapshot(q, (snapshot) => {
    const favorites = [];
    snapshot.forEach((doc) => favorites.push(doc.data()));
    callback(favorites);
  });
};
