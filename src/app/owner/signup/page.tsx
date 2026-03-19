"use client";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { requireAuth } from "@/lib/firebase";
import { ensureUserProfile } from "@/lib/userProfile";

export default function OwnerSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(requireAuth(), email, password);
      await ensureUserProfile({ uid: result.user.uid, email: result.user.email, role: "owner" });
      router.push("/owner/dashboard");
    } catch (e: any) {
      setError(e?.message ?? "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <div className="rounded-[32px] border border-[var(--border)] bg-[rgba(255,253,252,.92)] p-8 shadow-[var(--shadow)]">
          <h1 className="text-3xl font-semibold text-[var(--primary)]">Create owner account</h1>
          <form onSubmit={onSubmit} className="mt-6 grid gap-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" required />
            <button className="rounded-2xl bg-[var(--primary)] px-5 py-4 font-semibold text-white" disabled={loading}>{loading ? "Creating…" : "Create account"}</button>
          </form>
          {error ? <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700">{error}</div> : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
