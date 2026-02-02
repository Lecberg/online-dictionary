import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider, githubProvider } from "./firebase.js";

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const loginWithGithub = () => signInWithPopup(auth, githubProvider);

export const registerWithEmail = async (email, password, displayName) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  await updateProfile(userCredential.user, { displayName });
  return userCredential.user;
};

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = () => auth.currentUser;
