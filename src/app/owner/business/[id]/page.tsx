"use client";

import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db, requireStorage } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import type { BusinessRecord } from "@/lib/business";
import { normalizeBusiness } from "@/lib/business";

async function uploadLogo(file: File, ownerUid?: string) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const prefix = ownerUid ? `logos/${ownerUid}` : "logos/public";
  const storageRef = ref(requireStorage(), `${prefix}/${Date.now()}_${safeName}`);
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type });
  await new Promise<void>((resolve, reject) => task.on("state_changed", undefined, reject, () => resolve()));
  return await getDownloadURL(task.snapshot.ref);
}

export default function OwnerBusinessPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const id = useMemo(() => params?.id ?? "", [params]);
  const [biz, setBiz] = useState<BusinessRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id || authLoading || !user) return;
      try {
        if (!db) throw new Error("Firebase is not configured.");
        const snap = await getDoc(doc(db, "businesses", id));
        if (!snap.exists()) {
          setError("Business not found");
          return;
        }
        const data = normalizeBusiness({ id: snap.id, ...(snap.data() as any) });
        if (data.ownerUid && data.ownerUid !== user.uid) {
          setError("You do not have access to edit this business.");
          return;
        }
        setBiz(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load business");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id, user, authLoading]);

  const updateField = (key: keyof BusinessRecord, value: any) => biz && setBiz({ ...biz, [key]: value });

  const onSave = async () => {
    if (!user || !biz) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (!db) throw new Error("Firebase is not configured.");
      let logoUrl = biz.logoUrl ?? "";
      if (logoFile) logoUrl = await uploadLogo(logoFile, user.uid);
      await updateDoc(doc(db, "businesses", biz.id), {
        name: biz.name?.trim() ?? "",
        category: biz.category?.trim() ?? "",
        description: biz.description?.trim() ?? "",
        address: biz.address?.trim() ?? "",
        city: biz.city?.trim() ?? "",
        state: biz.state?.trim() ?? "",
        zip: biz.zip?.trim() ?? "",
        phone: biz.phone?.trim() ?? "",
        website: biz.website?.trim() ?? "",
        logoUrl,
        ownerUid: user.uid,
        ownerEmail: user.email ?? null,
        updatedAt: serverTimestamp(),
      });
      setMessage("Changes saved.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold text-[var(--primary)]">Edit business</h1>
          <button onClick={() => router.push("/owner/dashboard")} className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium">Back</button>
        </div>
        {authLoading && <p className="mt-8 text-[var(--muted)]">Loading…</p>}
        {!authLoading && !user && <a href="/owner/login" className="mt-6 inline-flex rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white">Login</a>}
        {error && <div className="mt-8 rounded-xl border border-red-300 bg-red-50 p-4 text-red-800">{error}</div>}
        {message && <div className="mt-8 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">{message}</div>}
        {!loading && biz && (
          <div className="mt-8 space-y-4 rounded-[32px] border border-[var(--border)] bg-[rgba(255,253,252,.92)] p-6 shadow-[var(--shadow)]">
            <input className="w-full rounded-2xl border border-[var(--border)] bg-white p-3" value={biz.name} onChange={(e) => updateField("name", e.target.value)} />
            <input className="w-full rounded-2xl border border-[var(--border)] bg-white p-3" value={biz.category || ""} onChange={(e) => updateField("category", e.target.value)} />
            <textarea className="w-full rounded-2xl border border-[var(--border)] bg-white p-3" rows={4} value={biz.description || ""} onChange={(e) => updateField("description", e.target.value)} />
            <div className="grid gap-4 md:grid-cols-2">
              <input className="rounded-2xl border border-[var(--border)] bg-white p-3" value={biz.phone || ""} onChange={(e) => updateField("phone", e.target.value)} placeholder="Phone" />
              <input className="rounded-2xl border border-[var(--border)] bg-white p-3" value={biz.website || ""} onChange={(e) => updateField("website", e.target.value)} placeholder="Website" />
            </div>
            <input className="w-full rounded-2xl border border-[var(--border)] bg-white p-3" value={biz.address || ""} onChange={(e) => updateField("address", e.target.value)} placeholder="Address" />
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} className="w-full rounded-2xl border border-[var(--border)] bg-white p-3" />
            <button onClick={onSave} disabled={saving} className="rounded-2xl bg-[var(--primary)] px-5 py-4 font-semibold text-white">{saving ? "Saving…" : "Save changes"}</button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
