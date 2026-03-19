"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth, requireAuth } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const authInstance = requireAuth();
    const unsub = onAuthStateChanged(authInstance, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { user, loading };
}
