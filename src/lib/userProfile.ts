"use client";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { requireDb } from "@/lib/firebase";

export type UserRole = "owner" | "admin" | "user";

export async function ensureUserProfile(params: {
  uid: string;
  email?: string | null;
  role?: UserRole;
}) {
  const firestore = requireDb();
  const ref = doc(firestore, "users", params.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    email: params.email ?? null,
    role: params.role ?? "user",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  const firestore = requireDb();
  const snap = await getDoc(doc(firestore, "users", uid));
  if (!snap.exists()) return null;
  return (snap.data()?.role as UserRole) ?? null;
}
