"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, requireAuth } from "@/lib/firebase";
import { DEFAULT_SITE_SETTINGS, sanitizeSettings } from "@/lib/siteSettings";
import { useAuth } from "@/lib/useAuth";
import { hasAdminAccess } from "@/lib/admin";

export default function Navbar() {
  const { user, loading } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!db) return;

    getDoc(doc(db, "siteSettings", "public"))
      .then((snap) => {
        if (snap.exists()) setSettings(sanitizeSettings(snap.data() as any));
      })
      .catch(() => undefined);
  }, []);

  const header = settings.header;
  const links = header.links.filter((link) => link.visible);
  const isAdmin = hasAdminAccess(user?.email);
  if (!header.visible) return null;

  return (
    <>
      {header.showAnnouncement && header.announcementText ? (
        <div className="border-b border-[var(--border)] bg-[var(--surface-alt)] px-4 py-2 text-center text-sm text-[var(--primary)]">
          <Link href={header.announcementLink || "/submit"}>{header.announcementText}</Link>
        </div>
      ) : null}
      <header className={`${header.sticky ? "sticky top-0 z-40" : ""} border-b border-[var(--border)] bg-[rgba(255,253,252,0.9)] backdrop-blur`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            {header.showLogo && header.logoUrl ? <img src={header.logoUrl} alt={header.brandName} className="h-11 w-11 rounded-2xl object-cover shadow-[var(--shadow-soft)]" /> : <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-lg font-bold text-white shadow-[var(--shadow-soft)]">G</div>}
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{header.domainText}</p>
              <p className="text-lg font-semibold text-[var(--primary)]">{header.brandName}</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {links.map((link) => <Link key={link.id} href={link.href} className={`rounded-full px-4 py-2 text-sm font-medium ${link.isButton ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-alt)] hover:text-[var(--primary)]"}`}>{link.label}</Link>)}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {header.showPrimaryCta ? <Link href={header.primaryCtaHref || "/submit"} className="hidden rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--primary)] sm:inline-flex">{header.primaryCtaLabel}</Link> : null}
            {!loading ? (
              user ? (
                <>
                  {isAdmin ? <Link href="/admin" className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">Admin panel</Link> : null}
                  <button onClick={() => signOut(requireAuth())} className="hidden rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--muted)] sm:inline-flex">Log out</button>
                </>
              ) : (
                <Link href="/login" className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">Sign in</Link>
              )
            ) : null}
            <button onClick={() => setOpen((v) => !v)} className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--primary)] md:hidden">Menu</button>
          </div>
        </div>
        {open ? (
          <div className="border-t border-[var(--border)] bg-white px-4 py-4 md:hidden">
            <div className="grid gap-2">
              {links.map((link) => <Link key={link.id} href={link.href} onClick={() => setOpen(false)} className={`rounded-2xl px-4 py-3 text-sm font-medium ${link.isButton ? "bg-[var(--primary)] text-white" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"}`}>{link.label}</Link>)}
              {header.showPrimaryCta ? <Link href={header.primaryCtaHref || "/submit"} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-sm font-medium text-[var(--primary)]">{header.primaryCtaLabel}</Link> : null}
              {!loading && !user ? <Link href="/login" className="rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white">Sign in</Link> : null}
              {!loading && user && isAdmin ? <Link href="/admin" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--primary)]">Admin panel</Link> : null}
              {!loading && user ? <button onClick={() => signOut(requireAuth())} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--text)]">Log out</button> : null}
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}
