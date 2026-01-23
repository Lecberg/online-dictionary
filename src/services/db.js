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
 * Save a word to user's search history
 */
export const saveToHistory = async (uid, word) => {
  if (!uid) return;
  const historyRef = doc(db, "users", uid, "searchHistory", word.toLowerCase());
  await setDoc(historyRef, {
    word: word.toLowerCase(),
    timestamp: serverTimestamp(),
  });
};

/**
 * Get real-time updates for search history
 */
export const listenToHistory = (uid, callback) => {
  if (!uid) return null;
  const historyRef = collection(db, "users", uid, "searchHistory");
  const q = query(historyRef, orderBy("timestamp", "desc"), limit(10));

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
