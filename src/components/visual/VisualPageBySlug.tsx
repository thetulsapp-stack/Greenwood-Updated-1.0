"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { DEFAULT_SITE_SETTINGS, getPageBySlug, sanitizeSettings } from "@/lib/siteSettings";
import PageRenderer from "@/components/visual/PageRenderer";

export default function VisualPageBySlug({ slug }: { slug: string }) {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!db) {
      setReady(true);
      return;
    }

    getDoc(doc(db, "siteSettings", "public"))
      .then((snap) => {
        if (snap.exists()) setSettings(sanitizeSettings(snap.data() as any));
      })
      .finally(() => setReady(true));
  }, []);

  const page = getPageBySlug(settings, slug);

  return (
    <>
      <Navbar />
      <main>
        {!ready ? (
          <div className="px-6 py-10">Loading…</div>
        ) : page ? (
          <PageRenderer settings={settings} page={page} />
        ) : (
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <h1 className="text-3xl font-semibold text-[var(--primary)]">Page not found</h1>
            <p className="mt-3 text-[var(--muted)]">Create this page in the Greenwood visual editor or update its slug.</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
