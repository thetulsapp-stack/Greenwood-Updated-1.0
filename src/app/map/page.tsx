"use client";

import { GoogleMap, InfoWindow, LoadScript, Marker } from "@react-google-maps/api";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { normalizeBusiness, type BusinessRecord } from "@/lib/business";

const center = { lat: 42.3314, lng: -83.0458 };
const containerStyle = { width: "100%", height: "70vh" };

export default function MapPage() {
  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [selected, setSelected] = useState<BusinessRecord | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_KEY;

  useEffect(() => {
    if (!db) return;

    getDocs(collection(db, "businesses"))
      .then((snap) => setBusinesses(snap.docs.map((docSnap) => normalizeBusiness({ id: docSnap.id, ...(docSnap.data() as any) }))))
      .catch(() => setBusinesses([]));
  }, []);

  const markers = useMemo(() => businesses.filter((b) => (b.status === "approved" || !b.status) && typeof b.lat === "number" && typeof b.lng === "number"), [businesses]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--primary)]">Map view</h1>
            <p className="mt-2 text-[var(--muted)]">A visual discovery layer for mobile and web visitors.</p>
          </div>
          <a href="/directory" className="rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--primary)]">Back to directory</a>
        </div>

        {!apiKey ? (
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-8 text-[var(--muted)]">
            Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> before deploying to Vercel to enable the live map.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-[var(--border)] shadow-[var(--shadow)]">
            <LoadScript googleMapsApiKey={apiKey}>
              <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={11}>
                {markers.map((business) => (
                  <Marker key={business.id} position={{ lat: business.lat as number, lng: business.lng as number }} onClick={() => setSelected(business)} />
                ))}
                {selected ? (
                  <InfoWindow position={{ lat: selected.lat as number, lng: selected.lng as number }} onCloseClick={() => setSelected(null)}>
                    <div className="max-w-xs p-1">
                      <p className="font-semibold">{selected.name}</p>
                      <p className="text-sm text-gray-600">{selected.category}</p>
                      <p className="mt-1 text-sm text-gray-600">{selected.address}</p>
                      <a href={`/business/${selected.id}`} className="mt-2 inline-block text-sm font-semibold text-[var(--primary)]">View details</a>
                    </div>
                  </InfoWindow>
                ) : null}
              </GoogleMap>
            </LoadScript>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
