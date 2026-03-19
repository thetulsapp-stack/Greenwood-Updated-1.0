"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_SITE_SETTINGS, sanitizeSettings } from "@/lib/siteSettings";

export default function Footer() {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    if (!db) return;

    getDoc(doc(db, "siteSettings", "public"))
      .then((snap) => {
        if (snap.exists()) setSettings(sanitizeSettings(snap.data() as any));
      })
      .catch(() => undefined);
  }, []);

  const footer = settings.footer;
  if (!footer.visible) return null;

  return (
    <footer className="mt-20 border-t border-[var(--border)] bg-[rgba(255,253,252,0.9)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_repeat(2,minmax(0,1fr))]">
        {footer.showBrandBlock ? (
          <div>
            <p className="text-lg font-semibold text-[var(--primary)]">{footer.brandTitle}</p>
            <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">{footer.description}</p>
          </div>
        ) : <div />}
        {footer.groups.filter((group) => group.visible).map((group) => (
          <div key={group.id}>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{group.title}</p>
            <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              {group.links.filter((link) => link.visible).map((link) => (
                <div key={link.id}><Link href={link.href}>{link.label}</Link></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--border)] px-4 py-4 text-center text-sm text-[var(--muted)]">
        {footer.copyright || `© ${new Date().getFullYear()} Greenwood`}
      </div>
    </footer>
  );
}
