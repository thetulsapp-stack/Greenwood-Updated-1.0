"use client";

import Link from "next/link";
import Image from "next/image";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import type { SiteSettings, VisualPage, VisualSection, CtaSection } from "@/lib/siteSettings";
import { cssThemeVars } from "@/lib/colors";
import { db } from "@/lib/firebase";

function MediaBlock({ section }: { section: Extract<VisualSection, { type: "hero" | "media" }> }) {
  if (!section.mediaUrl) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border p-8 text-center" style={{ borderColor: section.style.border, backgroundColor: section.style.cardBackground, color: section.style.muted }}>
        Add media in the editor.
      </div>
    );
  }
  if (section.mediaType === "video") return <video src={section.mediaUrl} controls className="w-full rounded-[28px] border bg-black" style={{ borderColor: section.style.border }} />;
  const useNextImage = section.mediaUrl.startsWith("/");
  if (useNextImage) return <Image src={section.mediaUrl} alt={(section as any).mediaAlt || "Media"} width={1200} height={900} className="h-auto w-full rounded-[28px] border bg-white object-cover" style={{ borderColor: section.style.border }} />;
  return <img src={section.mediaUrl} alt={(section as any).mediaAlt || "Media"} className="h-auto w-full rounded-[28px] border bg-white object-cover" style={{ borderColor: section.style.border }} />;
}

function SubscribeForm({ section }: { section: CtaSection }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (!db) throw new Error("Firebase is not configured.");

      await addDoc(collection(db, "subscribers"), {
        name: name.trim() || null,
        email: email.trim().toLowerCase(),
        source: "landing_page",
        createdAt: serverTimestamp(),
      });
      setName("");
      setEmail("");
      setMessage(section.successMessage || "Thanks for subscribing.");
    } catch (e: any) {
      setError(e?.message || "Could not subscribe right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-3 sm:max-w-md">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder={section.namePlaceholder || "Your name"} className="rounded-2xl border px-4 py-3" style={{ borderColor: section.style.border, backgroundColor: section.style.cardBackground, color: section.style.cardText }} />
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={section.emailPlaceholder || "Email address"} className="rounded-2xl border px-4 py-3" style={{ borderColor: section.style.border, backgroundColor: section.style.cardBackground, color: section.style.cardText }} />
      <button type="submit" disabled={loading} className="rounded-2xl px-5 py-3 text-sm font-semibold" style={{ backgroundColor: section.style.buttonBackground, color: section.style.buttonText }}>{loading ? "Subscribing…" : section.buttonLabel || "Subscribe"}</button>
      {message ? <p className="text-sm" style={{ color: section.style.muted }}>{message}</p> : null}
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
    </form>
  );
}

function RenderSection({ section }: { section: VisualSection }) {
  if (!section.visible) return null;
  switch (section.type) {
    case "hero":
      return (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-16">
          <div className="grid items-center gap-8 rounded-[36px] border p-6 shadow-[var(--shadow)] lg:grid-cols-[1.05fr_.95fr] lg:p-8" style={{ borderColor: section.style.border, backgroundColor: section.style.background }}>
            <div>
              <div className="inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ backgroundColor: section.style.cardBackground, color: section.style.muted }}>{section.eyebrow}</div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl" style={{ color: section.style.text }}>{section.title}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8" style={{ color: section.style.muted }}>{section.text}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                {section.primaryLabel ? <Link href={section.primaryHref || "/"} className="rounded-full px-5 py-3 text-sm font-semibold" style={{ backgroundColor: section.style.buttonBackground, color: section.style.buttonText }}>{section.primaryLabel}</Link> : null}
                {section.secondaryLabel ? <Link href={section.secondaryHref || "/"} className="rounded-full border px-5 py-3 text-sm font-semibold" style={{ borderColor: section.style.border, backgroundColor: section.style.cardBackground, color: section.style.cardText }}>{section.secondaryLabel}</Link> : null}
              </div>
            </div>
            <MediaBlock section={section} />
          </div>
        </section>
      );
    case "text":
      return (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className={`rounded-[32px] border p-6 shadow-[var(--shadow-soft)] lg:p-8 ${section.align === "center" ? "text-center" : ""}`} style={{ borderColor: section.style.border, backgroundColor: section.style.background }}>
            <h2 className="text-3xl font-semibold" style={{ color: section.style.text }}>{section.title}</h2>
            <p className="mt-4 whitespace-pre-wrap text-base leading-8" style={{ color: section.style.muted }}>{section.body}</p>
          </div>
        </section>
      );
    case "cards":
      return (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="rounded-[32px] border p-6 shadow-[var(--shadow-soft)] lg:p-8" style={{ borderColor: section.style.border, backgroundColor: section.style.background }}>
            <h2 className="text-3xl font-semibold" style={{ color: section.style.text }}>{section.title}</h2>
            <p className="mt-3 max-w-3xl" style={{ color: section.style.muted }}>{section.body}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {section.cards.filter((card) => card.visible).map((card) => (
                <div key={card.id} className="rounded-[28px] border p-5" style={{ borderColor: section.style.border, backgroundColor: section.style.cardBackground }}>
                  <h3 className="text-lg font-semibold" style={{ color: section.style.cardText }}>{card.title}</h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: section.style.cardText }}>{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    case "media":
      return (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="rounded-[32px] border p-6 shadow-[var(--shadow-soft)] lg:p-8" style={{ borderColor: section.style.border, backgroundColor: section.style.background }}>
            <h2 className="text-3xl font-semibold" style={{ color: section.style.text }}>{section.title}</h2>
            <div className="mt-5"><MediaBlock section={section} /></div>
            {section.caption ? <p className="mt-3 text-sm" style={{ color: section.style.muted }}>{section.caption}</p> : null}
          </div>
        </section>
      );
    case "cta":
      return (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="rounded-[32px] border p-8 shadow-[var(--shadow)]" style={{ borderColor: section.style.border, backgroundColor: section.style.background, color: section.style.text }}>
            <h2 className="text-3xl font-semibold">{section.title}</h2>
            <p className="mt-3 max-w-2xl" style={{ color: section.style.muted }}>{section.body}</p>
            {section.mode === "subscribe" ? <SubscribeForm section={section} /> : (section.buttonLabel ? <Link href={section.buttonHref || "/"} className="mt-6 inline-flex rounded-full px-5 py-3 text-sm font-semibold" style={{ backgroundColor: section.style.buttonBackground, color: section.style.buttonText }}>{section.buttonLabel}</Link> : null)}
          </div>
        </section>
      );
    case "spacer":
      return <div className={section.height === "sm" ? "h-6" : section.height === "lg" ? "h-20" : "h-12"} />;
  }
}

export default function PageRenderer({ settings, page }: { settings: SiteSettings; page: VisualPage }) {
  return <div style={cssThemeVars(settings.theme)}>{page.sections.map((section) => <RenderSection key={section.id} section={section} />)}</div>;
}
