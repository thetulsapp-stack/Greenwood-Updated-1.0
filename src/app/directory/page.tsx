"use client";

export const dynamic = "force-dynamic";

import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import BusinessCard from "@/components/BusinessCard";
import { db } from "@/lib/firebase";
import { cssThemeVars } from "@/lib/colors";
import { DEFAULT_SITE_SETTINGS, sanitizeSettings } from "@/lib/siteSettings";
import { haversineMiles, normalizeBusiness, type BusinessRecord } from "@/lib/business";

const RADII = [1, 3, 5, 10, 25];

async function geocodeAddress(address: string, apiKey?: string) {
  if (!apiKey || !address.trim()) return null;
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${encodeURIComponent(apiKey)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const loc = data?.results?.[0]?.geometry?.location;
  return loc ? { lat: Number(loc.lat), lng: Number(loc.lng) } : null;
}

export default function DirectoryPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BusinessRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "All");
  const [radius, setRadius] = useState(Number(params.get("radius") ?? "5"));
  const [locationText, setLocationText] = useState(params.get("loc") ?? "");
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(() => {
    const lat = Number(params.get("lat"));
    const lng = Number(params.get("lng"));
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  });
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        if (!db) {
          setError("Firebase is not configured.");
          return;
        }
        const [settingsSnap, businessSnap] = await Promise.all([
          getDoc(doc(db, "siteSettings", "public")),
          getDocs(collection(db, "businesses")),
        ]);

        if (settingsSnap.exists()) {
          setSettings(sanitizeSettings(settingsSnap.data() as any));
        }

        let records = businessSnap.docs
          .map((docSnap) =>
            normalizeBusiness({ id: docSnap.id, ...(docSnap.data() as any) })
          )
          .filter((record) => record.status === "approved" || !record.status);

        let currentGeo = geo;

        if (!currentGeo && locationText.trim()) {
          currentGeo = await geocodeAddress(
            locationText,
            process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_KEY
          );
          if (currentGeo) setGeo(currentGeo);
        }

        if (currentGeo) {
          records = records
            .map((record) => {
              if (typeof record.lat !== "number" || typeof record.lng !== "number") {
                return record;
              }
              return {
                ...record,
                distanceMiles: haversineMiles(currentGeo!, {
                  lat: record.lat,
                  lng: record.lng,
                }),
              };
            })
            .filter(
              (record) =>
                typeof record.distanceMiles !== "number" ||
                record.distanceMiles <= radius
            )
            .sort((a, b) => (a.distanceMiles ?? 999) - (b.distanceMiles ?? 999));
        }

        setItems(records);
        setError(null);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load directory");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [geo, locationText, radius]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        [
          item.name,
          item.description,
          item.category,
          item.address,
          item.city,
          item.neighborhood,
        ].some((value) => String(value || "").toLowerCase().includes(q));

      const matchesCategory =
        category === "All" ||
        item.category === category ||
        item.categoryGroup === category;

      return matchesSearch && matchesCategory;
    });
  }, [items, search, category]);

  const applyFilters = async () => {
    setLocLoading(true);
    try {
      const next = new URLSearchParams();
      if (search.trim()) next.set("q", search.trim());
      if (category !== "All") next.set("category", category);
      if (locationText.trim()) next.set("loc", locationText.trim());
      if (geo) {
        next.set("lat", String(geo.lat));
        next.set("lng", String(geo.lng));
      }
      next.set("radius", String(radius));
      router.replace(`/directory?${next.toString()}`);
    } finally {
      setLocLoading(false);
    }
  };

  return (
    <div style={cssThemeVars(settings.theme)}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="rounded-[32px] border border-[var(--border)] bg-[rgba(255,253,252,0.92)] p-6 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Directory
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--primary)]">
                Browse local businesses
              </h1>
              <p className="mt-2 text-[var(--muted)]">
                Use search, category filters, and distance controls to find businesses fast.
              </p>
            </div>
            <a
              href="/map"
              className="rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--primary)]"
            >
              Open map view
            </a>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
            <SearchBar
              search={search}
              setSearch={setSearch}
              placeholder="Search by name, category, neighborhood, or ZIP"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
            >
              {["All", ...settings.categories].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
            >
              {RADII.map((item) => (
                <option key={item} value={item}>
                  Within {item} mi
                </option>
              ))}
            </select>
            <input
              value={locationText}
              onChange={(e) => {
                setLocationText(e.target.value);
                setGeo(null);
              }}
              placeholder="Address or ZIP"
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
            />
            <button
              onClick={applyFilters}
              className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white"
            >
              {locLoading ? "Applying…" : "Apply"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-4">
          <p className="text-sm text-[var(--muted)]">
            {loading ? "Loading businesses…" : `${filtered.length} businesses found`}
          </p>
          <a href="/submit" className="text-sm font-semibold text-[var(--primary)]">
            Want your business listed? →
          </a>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {!loading && filtered.length
            ? filtered.map((item) => <BusinessCard key={item.id} business={item} />)
            : null}

          {!loading && !filtered.length ? (
            <div className="col-span-full rounded-[28px] border border-dashed border-[var(--border)] bg-white p-8 text-[var(--muted)]">
              No businesses match these filters yet. Adjust your search or add the first listing in this category.
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}