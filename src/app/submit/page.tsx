"use client";

import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db, requireDb, requireStorage } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { DEFAULT_SITE_SETTINGS, sanitizeSettings } from "@/lib/siteSettings";
import { cssThemeVars } from "@/lib/colors";

async function uploadLogo(file: File, ownerUid?: string) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const prefix = ownerUid ? `logos/${ownerUid}` : "logos/public";
  const storageRef = ref(requireStorage(), `${prefix}/${Date.now()}_${safeName}`);
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type });
  await new Promise<void>((resolve, reject) => task.on("state_changed", undefined, reject, () => resolve()));
  return await getDownloadURL(task.snapshot.ref);
}

export default function SubmitBusiness() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [form, setForm] = useState({
    name: "",
    category: DEFAULT_SITE_SETTINGS.categories[0],
    description: "",
    address: "",
    city: "Detroit",
    state: "MI",
    zip: "",
    phone: "",
    website: "",
    neighborhood: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;

    getDoc(doc(db, "siteSettings", "public"))
      .then((snap) => {
        const next = sanitizeSettings(snap.data() as any);
        setSettings(next);
        setForm((prev) => ({ ...prev, category: prev.category || next.categories[0] }));
      })
      .catch(() => undefined);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const firestore = requireDb();
      let logoUrl = "";
      if (logoFile) {
        try {
          logoUrl = await uploadLogo(logoFile, user?.uid);
        } catch {
          logoUrl = "";
        }
      }

      await addDoc(collection(firestore, "businesses"), {
        name: form.name.trim(),
        category: form.category,
        categoryGroup: form.category,
        description: form.description.trim(),
        address: form.address.trim(),
        neighborhood: form.neighborhood.trim(),
        city: form.city.trim() || "Detroit",
        state: form.state.trim() || "MI",
        zip: form.zip.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        logoUrl,
        status: "pending",
        ownerUid: user?.uid ?? null,
        ownerEmail: user?.email ?? null,
        rating: 0,
        reviewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMessage("Business submitted. It will appear after admin approval.");
      setForm({ name: "", category: settings.categories[0], description: "", address: "", city: "Detroit", state: "MI", zip: "", phone: "", website: "", neighborhood: "" });
      setLogoFile(null);
    } catch (err: any) {
      setError(err?.message ?? "Error submitting business.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={cssThemeVars(settings.theme)}>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-[32px] border border-[var(--border)] bg-[rgba(255,253,252,0.92)] p-6 shadow-[var(--shadow)] sm:p-8">
          <h1 className="text-3xl font-semibold text-[var(--primary)]">Submit your business</h1>
          <p className="mt-2 text-[var(--muted)]">Mobile-friendly intake form built for fast onboarding and sponsor-ready growth.</p>

          {message ? <div className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">{message}</div> : null}
          {error ? <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700">{error}</div> : null}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <input type="text" placeholder="Business name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" required />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" required>
              {settings.categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <textarea placeholder="Describe what makes your business special" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" rows={5} required />
            <input type="text" placeholder="Neighborhood" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
            <input type="text" placeholder="Street address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
            <div className="grid gap-4 sm:grid-cols-3">
              <input type="text" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
              <input type="text" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
              <input type="text" placeholder="ZIP" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="text" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
              <input type="url" placeholder="Website (https://...)" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <p className="text-sm font-semibold text-[var(--text)]">Logo</p>
              <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} className="mt-2 w-full" />
            </div>
            <button disabled={loading} className="rounded-2xl bg-[var(--primary)] px-6 py-4 font-semibold text-white disabled:opacity-60">{loading ? "Submitting…" : "Submit business"}</button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
