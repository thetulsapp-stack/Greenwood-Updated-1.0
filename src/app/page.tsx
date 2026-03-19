"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageRenderer from "@/components/visual/PageRenderer";
import { db } from "@/lib/firebase";
import { DEFAULT_SITE_SETTINGS, getPageBySlug, sanitizeSettings } from "@/lib/siteSettings";

export default function Home() {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    if (!db) return;

    getDoc(doc(db, "siteSettings", "public"))
      .then((snap) => {
        if (snap.exists()) setSettings(sanitizeSettings(snap.data() as any));
      })
      .catch(() => undefined);
  }, []);

  const page = getPageBySlug(settings, "/") || settings.pages[0];

  return (
    <>
      <Navbar />
      <main>
        <PageRenderer settings={settings} page={page} />
      </main>
      <Footer />
    </>
  );
}
