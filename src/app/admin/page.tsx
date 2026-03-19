"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { hasAdminAccess } from "@/lib/admin";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { cssThemeVars } from "@/lib/colors";
import {
  DEFAULT_SITE_SETTINGS,
  sanitizeSettings,
  type SiteSettings,
} from "@/lib/siteSettings";
import { normalizeBusiness, type BusinessRecord } from "@/lib/business";

type AdminTab = "pending" | "businesses" | "categories" | "site";

type EditableBusiness = BusinessRecord & {
  featured?: boolean;
  status?: string;
};

const EMPTY_EDIT: EditableBusiness = {
  id: "",
  name: "",
  category: "",
  description: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  website: "",
  logoUrl: "",
  status: "pending",
  verified: false,
  featured: false,
};

function copyBusiness(item: EditableBusiness): EditableBusiness {
  return {
    ...EMPTY_EDIT,
    ...item,
  };
}

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function BusinessForm({
  value,
  onChange,
  onSave,
  onCancel,
  saving,
  allowStatus = true,
}: {
  value: EditableBusiness;
  onChange: (next: EditableBusiness) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  allowStatus?: boolean;
}) {
  const set = (key: keyof EditableBusiness, next: any) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span>Name</span>
          <input
            value={value.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
            className="rounded-2xl border border-[var(--border)] px-4 py-3"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span>Category</span>
          <input
            value={value.category ?? ""}
            onChange={(e) => set("category", e.target.value)}
            className="rounded-2xl border border-[var(--border)] px-4 py-3"
          />
        </label>

        <label className="grid gap-1 text-sm md:col-span-2">
          <span>Description</span>
          <textarea
            rows={4}
            value={value.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            className="rounded-2xl border border-[var(--border)] px-4 py-3"
          />
        </label>

        <label className="grid gap-1 text-sm md:col-span-2">
          <span>Address</span>
          <input
            value={value.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
            className="rounded-2xl border border-[var(--border)] px-4 py-3"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span>City</span>
          <input
            value={value.city ?? ""}
            onChange={(e) => set("city", e.target.value)}
            className="rounded-2xl border border-[var(--border)] px-4 py-3"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span>State</span>
          <input
            value={value.state ?? ""}
            onChange={(e) => set("state", e.target.value)}
            className="rounded-2xl border border-[var(--border)] px-4 py-3"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span>ZIP</span>
          <input
            value={value.zip ?? ""}
            onChange={(e) => set("zip", e.target.value)}
            className="rounded-2xl border border-[var(--border)] px-4 py-3"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span>Phone</span>
          <input
            value={value.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
            className="rounded-2xl border border-[var(--border)] px-4 py-3"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span>Website</span>
          <input
            value={value.website ?? ""}
            onChange={(e) => set("website", e.target.value)}
            className="rounded-2xl border border-[var(--border)] px-4 py-3"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span>Logo URL</span>
          <input
            value={value.logoUrl ?? ""}
            onChange={(e) => set("logoUrl", e.target.value)}
            className="rounded-2xl border border-[var(--border)] px-4 py-3"
          />
        </label>

        {allowStatus ? (
          <label className="grid gap-1 text-sm">
            <span>Status</span>
            <select
              value={value.status ?? "pending"}
              onChange={(e) => set("status", e.target.value)}
              className="rounded-2xl border border-[var(--border)] px-4 py-3"
            >
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </label>
        ) : null}

        <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={!!value.verified}
            onChange={(e) => set("verified", e.target.checked)}
          />
          Verified
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={!!value.featured}
            onChange={(e) => set("featured", e.target.checked)}
          />
          Featured
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save business"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--text)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [tab, setTab] = useState<AdminTab>("pending");
  const [items, setItems] = useState<EditableBusiness[]>([]);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableBusiness>(EMPTY_EDIT);

  const [categoriesDraft, setCategoriesDraft] = useState("");
  const [siteDraft, setSiteDraft] = useState({
    brandName: DEFAULT_SITE_SETTINGS.brandName,
    tagline: DEFAULT_SITE_SETTINGS.tagline,
    serviceArea: DEFAULT_SITE_SETTINGS.serviceArea,
    mission: DEFAULT_SITE_SETTINGS.mission,
  });

  const isAdmin = hasAdminAccess(user?.email);
  const canLoad = !!db && !!user && isAdmin;

  async function loadData() {
    if (!db) {
      setError("Firebase is not configured.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [settingsSnap, businessesSnap] = await Promise.all([
        getDoc(doc(db, "siteSettings", "public")),
        getDocs(collection(db, "businesses")),
      ]);

      const safeSettings = settingsSnap.exists()
        ? sanitizeSettings(settingsSnap.data() as any)
        : DEFAULT_SITE_SETTINGS;

      const businessItems = businessesSnap.docs.map((snap) =>
        normalizeBusiness({
          id: snap.id,
          ...(snap.data() as any),
        })
      ) as EditableBusiness[];

      setSettings(safeSettings);
      setCategoriesDraft(safeSettings.categories.join("\n"));
      setSiteDraft({
        brandName: safeSettings.brandName,
        tagline: safeSettings.tagline,
        serviceArea: safeSettings.serviceArea,
        mission: safeSettings.mission,
      });
      setItems(businessItems);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && canLoad) {
      loadData();
    } else if (!authLoading && !user) {
      setLoading(false);
    } else if (!authLoading && user && !isAdmin) {
      setLoading(false);
    }
  }, [authLoading, canLoad, user, isAdmin]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (!q) return true;
      return [
        item.name,
        item.category,
        item.address,
        item.city,
        item.ownerEmail,
        item.status,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .some((value) => value.includes(q));
    });
  }, [items, search]);

  const pendingItems = useMemo(
    () => filteredItems.filter((item) => (item.status ?? "pending") === "pending"),
    [filteredItems]
  );

  const approvedCount = items.filter((item) => item.status === "approved").length;
  const pendingCount = items.filter((item) => (item.status ?? "pending") === "pending").length;
  const rejectedCount = items.filter((item) => item.status === "rejected").length;

  async function patchBusiness(id: string, patch: Partial<EditableBusiness>, success: string) {
    if (!db) return;
    try {
      setBusyId(id);
      await updateDoc(doc(db, "businesses", id), patch as Record<string, any>);
      setItems((current) =>
        current.map((item) => (item.id === id ? normalizeBusiness({ ...item, ...patch }) as EditableBusiness : item))
      );
      setNotice(success);
      if (editingId === id) {
        setDraft((current) => ({ ...current, ...patch }));
      }
    } catch (e: any) {
      setError(e?.message ?? "Update failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function approveBusiness(item: EditableBusiness) {
    await patchBusiness(
      item.id,
      { status: "approved", verified: true },
      `${item.name} approved.`
    );
  }

  async function rejectBusiness(item: EditableBusiness) {
    await patchBusiness(
      item.id,
      { status: "rejected", verified: false },
      `${item.name} rejected.`
    );
  }

  async function removeBusiness(item: EditableBusiness) {
    if (!db) return;
    const confirmed = window.confirm(`Delete ${item.name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setBusyId(item.id);
      await deleteDoc(doc(db, "businesses", item.id));
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (editingId === item.id) {
        setEditingId(null);
        setDraft(EMPTY_EDIT);
      }
      setNotice(`${item.name} deleted.`);
    } catch (e: any) {
      setError(e?.message ?? "Delete failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveDraft() {
    if (!db || !draft.id) return;
    try {
      setBusyId(draft.id);
      const payload = {
        name: draft.name?.trim() ?? "",
        category: draft.category?.trim() ?? "",
        description: draft.description?.trim() ?? "",
        address: draft.address?.trim() ?? "",
        city: draft.city?.trim() ?? "",
        state: draft.state?.trim() ?? "",
        zip: draft.zip?.trim() ?? "",
        phone: draft.phone?.trim() ?? "",
        website: draft.website?.trim() ?? "",
        logoUrl: draft.logoUrl?.trim() ?? "",
        status: draft.status ?? "pending",
        verified: !!draft.verified,
        featured: !!draft.featured,
      };

      await updateDoc(doc(db, "businesses", draft.id), payload);
      setItems((current) =>
        current.map((item) =>
          item.id === draft.id
            ? (normalizeBusiness({ ...item, ...payload }) as EditableBusiness)
            : item
        )
      );
      setNotice(`${draft.name} saved.`);
      setEditingId(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save business.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveCategories() {
    if (!db) return;
    try {
      setBusyId("categories");
      const categories = Array.from(
        new Set(
          categoriesDraft
            .split(/\n|,/)
            .map((item) => item.trim())
            .filter(Boolean)
        )
      );

      const nextSettings = sanitizeSettings({
        ...settings,
        categories,
      });

      await setDoc(doc(db, "siteSettings", "public"), nextSettings, { merge: true });
      setSettings(nextSettings);
      setCategoriesDraft(nextSettings.categories.join("\n"));
      setNotice("Categories updated.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save categories.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveSiteBasics() {
    if (!db) return;
    try {
      setBusyId("site");
      const nextSettings = sanitizeSettings({
        ...settings,
        brandName: siteDraft.brandName.trim() || settings.brandName,
        tagline: siteDraft.tagline.trim(),
        serviceArea: siteDraft.serviceArea.trim(),
        mission: siteDraft.mission.trim(),
      });

      await setDoc(doc(db, "siteSettings", "public"), nextSettings, { merge: true });
      setSettings(nextSettings);
      setNotice("Site settings updated.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save site settings.");
    } finally {
      setBusyId(null);
    }
  }

  const activeEditorItem =
    editingId ? items.find((item) => item.id === editingId) ?? null : null;

  return (
    <div style={cssThemeVars(settings.theme)}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="rounded-[32px] border border-[var(--border)] bg-[rgba(255,253,252,0.95)] p-6 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Admin dashboard
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--primary)]">
                Approvals, business editing, and category control
              </h1>
              <p className="mt-2 max-w-3xl text-[var(--muted)]">
                New submissions stay pending until approved. Use this dashboard to review listings,
                edit records, and manage directory categories.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/submit"
                className="rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--text)]"
              >
                Open submit page
              </Link>
              <Link
                href="/directory"
                className="rounded-full bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white"
              >
                View live directory
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
            <div className="rounded-3xl border border-[var(--border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">Pending</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--primary)]">{pendingCount}</p>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">Approved</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--primary)]">{approvedCount}</p>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">Rejected</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--primary)]">{rejectedCount}</p>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">Categories</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--primary)]">{settings.categories.length}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              ["pending", "Pending approvals"],
              ["businesses", "All businesses"],
              ["categories", "Categories"],
              ["site", "Site basics"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value as AdminTab)}
                className={classNames(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  tab === value
                    ? "bg-[var(--primary)] text-white"
                    : "border border-[var(--border)] bg-white text-[var(--text)]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {notice ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {authLoading || loading ? (
          <div className="mt-6 rounded-3xl border border-[var(--border)] bg-white p-8 text-[var(--muted)]">
            Loading admin dashboard...
          </div>
        ) : !db ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700">
            Firebase is not configured. Add your environment variables in Vercel first.
          </div>
        ) : !user ? (
          <div className="mt-6 rounded-3xl border border-[var(--border)] bg-white p-8">
            <p className="text-lg font-semibold text-[var(--text)]">You need to sign in first.</p>
            <p className="mt-2 text-[var(--muted)]">Open the admin login page, then come back here.</p>
            <Link
              href="/admin/login"
              className="mt-4 inline-flex rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white"
            >
              Go to admin login
            </Link>
          </div>
        ) : !isAdmin ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700">
            Signed in as {user.email}, but that email is not listed in NEXT_PUBLIC_ADMIN_EMAILS.
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="space-y-6">
                <div className="rounded-3xl border border-[var(--border)] bg-white p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--text)]">
                        {tab === "pending"
                          ? "Pending approvals"
                          : tab === "businesses"
                          ? "All businesses"
                          : tab === "categories"
                          ? "Manage categories"
                          : "Site basics"}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {tab === "pending"
                          ? "Approve, reject, or edit submissions before they appear publicly."
                          : tab === "businesses"
                          ? "Search, update, feature, or remove existing records."
                          : tab === "categories"
                          ? "These categories power your filters and listing organization."
                          : "Quick-edit brand basics used across the site."}
                      </p>
                    </div>

                    {(tab === "pending" || tab === "businesses") ? (
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search businesses"
                        className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm"
                      />
                    ) : null}
                  </div>

                  {tab === "pending" ? (
                    <div className="mt-5 space-y-4">
                      {!pendingItems.length ? (
                        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-alt)] p-6 text-sm text-[var(--muted)]">
                          No pending businesses right now.
                        </div>
                      ) : (
                        pendingItems.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-lg font-semibold text-[var(--text)]">{item.name}</h3>
                                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                    {(item.status ?? "pending").toUpperCase()}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm text-[var(--muted)]">
                                  {item.category || "Uncategorized"} • {item.city || "Unknown city"} {item.state || ""}
                                </p>
                                {item.address ? (
                                  <p className="mt-1 text-sm text-[var(--muted)]">{item.address}</p>
                                ) : null}
                                {item.description ? (
                                  <p className="mt-3 text-sm text-[var(--text)]">{item.description}</p>
                                ) : null}
                                {item.ownerEmail ? (
                                  <p className="mt-2 text-xs text-[var(--muted)]">Owner email: {item.ownerEmail}</p>
                                ) : null}
                              </div>

                              <div className="flex flex-wrap gap-2 lg:justify-end">
                                <button
                                  type="button"
                                  disabled={busyId === item.id}
                                  onClick={() => approveBusiness(item)}
                                  className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === item.id}
                                  onClick={() => rejectBusiness(item)}
                                  className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-70"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(item.id);
                                    setDraft(copyBusiness(item));
                                  }}
                                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)]"
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}

                  {tab === "businesses" ? (
                    <div className="mt-5 space-y-3">
                      {!filteredItems.length ? (
                        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-alt)] p-6 text-sm text-[var(--muted)]">
                          No businesses match your search.
                        </div>
                      ) : (
                        filteredItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-[var(--text)]">{item.name}</h3>
                                <span
                                  className={classNames(
                                    "rounded-full px-3 py-1 text-xs font-semibold",
                                    item.status === "approved"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : item.status === "rejected"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-amber-100 text-amber-800"
                                  )}
                                >
                                  {(item.status ?? "pending").toUpperCase()}
                                </span>
                                {item.featured ? (
                                  <span className="rounded-full bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                                    FEATURED
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm text-[var(--muted)]">
                                {item.category || "Uncategorized"} • {item.address || "No address"}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(item.id);
                                  setDraft(copyBusiness(item));
                                }}
                                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={busyId === item.id}
                                onClick={() =>
                                  patchBusiness(
                                    item.id,
                                    { featured: !item.featured },
                                    `${item.name} ${item.featured ? "removed from" : "added to"} featured.`
                                  )
                                }
                                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] disabled:opacity-70"
                              >
                                {item.featured ? "Unfeature" : "Feature"}
                              </button>
                              <button
                                type="button"
                                disabled={busyId === item.id}
                                onClick={() => removeBusiness(item)}
                                className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-70"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}

                  {tab === "categories" ? (
                    <div className="mt-5 space-y-4">
                      <label className="grid gap-2 text-sm">
                        <span>One category per line</span>
                        <textarea
                          rows={12}
                          value={categoriesDraft}
                          onChange={(e) => setCategoriesDraft(e.target.value)}
                          className="rounded-3xl border border-[var(--border)] px-4 py-4"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={busyId === "categories"}
                        onClick={saveCategories}
                        className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
                      >
                        {busyId === "categories" ? "Saving..." : "Save categories"}
                      </button>
                    </div>
                  ) : null}

                  {tab === "site" ? (
                    <div className="mt-5 grid gap-4">
                      <label className="grid gap-1 text-sm">
                        <span>Brand name</span>
                        <input
                          value={siteDraft.brandName}
                          onChange={(e) => setSiteDraft((current) => ({ ...current, brandName: e.target.value }))}
                          className="rounded-2xl border border-[var(--border)] px-4 py-3"
                        />
                      </label>
                      <label className="grid gap-1 text-sm">
                        <span>Tagline</span>
                        <input
                          value={siteDraft.tagline}
                          onChange={(e) => setSiteDraft((current) => ({ ...current, tagline: e.target.value }))}
                          className="rounded-2xl border border-[var(--border)] px-4 py-3"
                        />
                      </label>
                      <label className="grid gap-1 text-sm">
                        <span>Service area</span>
                        <input
                          value={siteDraft.serviceArea}
                          onChange={(e) => setSiteDraft((current) => ({ ...current, serviceArea: e.target.value }))}
                          className="rounded-2xl border border-[var(--border)] px-4 py-3"
                        />
                      </label>
                      <label className="grid gap-1 text-sm">
                        <span>Mission</span>
                        <textarea
                          rows={6}
                          value={siteDraft.mission}
                          onChange={(e) => setSiteDraft((current) => ({ ...current, mission: e.target.value }))}
                          className="rounded-2xl border border-[var(--border)] px-4 py-3"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={busyId === "site"}
                        onClick={saveSiteBasics}
                        className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
                      >
                        {busyId === "site" ? "Saving..." : "Save site basics"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </section>

              <aside className="space-y-6">
                <div className="rounded-3xl border border-[var(--border)] bg-white p-5">
                  <h2 className="text-lg font-semibold text-[var(--text)]">Business editor</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Select a listing from Pending or All Businesses to edit it here.
                  </p>

                  {activeEditorItem ? (
                    <div className="mt-5">
                      <BusinessForm
                        value={draft}
                        onChange={setDraft}
                        onSave={saveDraft}
                        onCancel={() => {
                          setEditingId(null);
                          setDraft(EMPTY_EDIT);
                        }}
                        saving={busyId === draft.id}
                      />
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-alt)] p-6 text-sm text-[var(--muted)]">
                      No business selected.
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-[var(--border)] bg-white p-5">
                  <h2 className="text-lg font-semibold text-[var(--text)]">Approval rules</h2>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                    <li>• New submissions should save with status: pending</li>
                    <li>• Only approved businesses should appear in the live directory</li>
                    <li>• Rejected businesses stay hidden until edited or approved</li>
                  </ul>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
