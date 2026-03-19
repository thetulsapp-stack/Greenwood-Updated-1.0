export type BusinessRecord = {
  id: string;
  name: string;
  category?: string;
  categoryGroup?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  coverUrl?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  status?: string;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  sponsorTier?: string;
  neighborhood?: string;
  ownerUid?: string | null;
  ownerEmail?: string | null;
  distanceMiles?: number;
};

export function normalizeBusiness(record: BusinessRecord): BusinessRecord {
  return {
    ...record,
    lat: typeof record.lat === "number" ? record.lat : record.latitude,
    lng: typeof record.lng === "number" ? record.lng : record.longitude,
    verified: record.verified ?? (record.status === "approved"),
    rating: typeof record.rating === "number" ? record.rating : 0,
    reviewCount: typeof record.reviewCount === "number" ? record.reviewCount : 0,
  };
}

export function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
