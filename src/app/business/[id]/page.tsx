"use client";

import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { DEFAULT_SITE_SETTINGS, sanitizeSettings } from "@/lib/siteSettings";
import { cssThemeVars } from "@/lib/colors";
import { normalizeBusiness, type BusinessRecord } from "@/lib/business";
import { formatPhone, toAbsoluteUrl } from "@/lib/format";

type Review = { id: string; authorName?: string; comment?: string; rating?: number };

function FlowerRating({ value }: { value: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return <div className="flex gap-1 text-xl">{Array.from({ length: 5 }).map((_, i) => <span key={i} className={i < rounded ? "text-[var(--accent)]" : "text-[#dfd8c8]"}>✿</span>)}</div>;
}

export default function BusinessDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [business, setBusiness] = useState<BusinessRecord | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      if (!db) throw new Error("Firebase is not configured.");
      const [settingsSnap, businessSnap, reviewsSnap] = await Promise.all([
        getDoc(doc(db, "siteSettings", "public")),
        getDoc(doc(db, "businesses", params.id)),
        getDocs(query(collection(db, "reviews"), where("businessId", "==", params.id))),
      ]);
      if (settingsSnap.exists()) setSettings(sanitizeSettings(settingsSnap.data() as any));
      if (businessSnap.exists()) setBusiness(normalizeBusiness({ id: businessSnap.id, ...(businessSnap.data() as any) }));
      setReviews(reviewsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Review[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load business");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [params.id]);

  const mapsUrl = useMemo(() => {
    const text = [business?.address, business?.city, business?.state, business?.zip].filter(Boolean).join(", ");
    return text ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}` : undefined;
  }, [business]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    if (!user) {
      setError("Please sign in to leave a review.");
      return;
    }
    setMessage(null);
    setError(null);
    try {
      if (!db) throw new Error("Firebase is not configured.");

      await addDoc(collection(db, "reviews"), {
        businessId: business.id,
        rating: reviewRating,
        comment: reviewText.trim(),
        authorUid: user.uid,
        authorName: user.email?.split("@")[0] ?? "Customer",
        createdAt: serverTimestamp(),
      });
      const nextReviews = [...reviews, { id: crypto.randomUUID(), rating: reviewRating, comment: reviewText.trim(), authorName: user.email?.split("@")[0] ?? "Customer" }];
      const avg = nextReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / nextReviews.length;
      await updateDoc(doc(db, "businesses", business.id), { rating: Number(avg.toFixed(1)), reviewCount: nextReviews.length, updatedAt: serverTimestamp() });
      setReviews(nextReviews);
      setBusiness({ ...business, rating: Number(avg.toFixed(1)), reviewCount: nextReviews.length });
      setReviewText("");
      setMessage("Review submitted.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit review");
    }
  };

  const requestClaim = async () => {
    if (!business || !user) return;
    setMessage(null);
    setError(null);
    try {
      if (!db) throw new Error("Firebase is not configured.");

      await addDoc(collection(db, "claimRequests"), {
        businessId: business.id,
        businessName: business.name,
        ownerUid: user.uid,
        ownerEmail: user.email ?? null,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setMessage("Claim request sent to admin.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to send claim request");
    }
  };

  return (
    <div style={cssThemeVars(settings.theme)}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {loading ? <p className="text-[var(--muted)]">Loading business…</p> : null}
        {error ? <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700">{error}</div> : null}
        {business ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <section className="rounded-[32px] border border-[var(--border)] bg-[rgba(255,253,252,0.92)] p-6 shadow-[var(--shadow)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{business.categoryGroup || business.category}</p>
                  <h1 className="mt-2 text-4xl font-semibold text-[var(--primary)]">{business.name}</h1>
                  <div className="mt-4 flex items-center gap-3 text-sm text-[var(--muted)]"><FlowerRating value={business.rating || 0} /><span>{business.reviewCount || reviews.length} reviews</span></div>
                </div>
                <a href="/directory" className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--primary)]">Back</a>
              </div>
              <p className="mt-6 text-[var(--muted)]">{business.description || "No description yet."}</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-[var(--border)] bg-white p-5">
                  <p className="text-sm font-semibold text-[var(--primary)]">Contact</p>
                  <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                    {business.address ? <p>📍 {[business.address, business.city, business.state, business.zip].filter(Boolean).join(", ")}</p> : null}
                    {business.phone ? <p>☎ {formatPhone(business.phone)}</p> : null}
                    {business.website ? <p>↗ <a href={toAbsoluteUrl(business.website)} target="_blank" className="underline">Visit website</a></p> : null}
                  </div>
                </div>
                <div className="rounded-3xl border border-[var(--border)] bg-white p-5">
                  <p className="text-sm font-semibold text-[var(--primary)]">Actions</p>
                  <div className="mt-3 flex flex-col gap-3">
                    {mapsUrl ? <a href={mapsUrl} target="_blank" className="rounded-2xl bg-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-white">Open in Google Maps</a> : null}
                    {user ? <button onClick={requestClaim} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--primary)]">Request to claim this business</button> : <a href="/owner/login" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-center text-sm font-semibold text-[var(--primary)]">Owner login to claim</a>}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-[var(--border)] bg-[rgba(255,253,252,0.92)] p-6 shadow-[var(--shadow)]">
              <h2 className="text-2xl font-semibold text-[var(--primary)]">Reviews</h2>
              {message ? <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">{message}</div> : null}
              {!user ? <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--muted)]">Please <a href="/login" className="font-semibold text-[var(--primary)]">sign in</a> or <a href="/signup" className="font-semibold text-[var(--primary)]">create an account</a> to leave a review.</div> : null}
              <form onSubmit={submitReview} className="mt-5 grid gap-3">
                <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} flowers</option>)}
                </select>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share your experience" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" rows={4} required />
                <button disabled={!user} className="rounded-2xl bg-[var(--primary)] px-4 py-3 font-semibold text-white disabled:opacity-50">Leave review</button>
              </form>
              <div className="mt-6 space-y-4">
                {reviews.length ? reviews.map((review) => (
                  <div key={review.id} className="rounded-3xl border border-[var(--border)] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{review.authorName || "Guest"}</p>
                      <FlowerRating value={review.rating || 0} />
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted)]">{review.comment}</p>
                  </div>
                )) : <p className="text-[var(--muted)]">No reviews yet.</p>}
              </div>
            </section>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
