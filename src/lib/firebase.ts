import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigMissing = Object.values(firebaseConfig).some((value) => !value);

if (firebaseConfigMissing) {
  console.warn("Firebase environment variables are missing. Add them before deploying.");
}

const app = firebaseConfigMissing
  ? null
  : getApps().length
    ? getApp()
    : initializeApp(firebaseConfig as Record<string, string>);

export const db: Firestore | null = app
  ? initializeFirestore(app, {
      ignoreUndefinedProperties: true,
    })
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;

export function requireDb(): Firestore {
  if (!db) throw new Error("Firebase is not configured.");
  return db;
}

export function requireAuth(): Auth {
  if (!auth) throw new Error("Firebase Auth is not configured.");
  return auth;
}

export function requireStorage(): FirebaseStorage {
  if (!storage) throw new Error("Firebase Storage is not configured.");
  return storage;
}
