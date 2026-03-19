export interface Business {
  id: string;
  name: string;
  description: string;
  category: string;

  address?: string;
  city?: string;
  state?: string;
  zip?: string;

  latitude?: number;
  longitude?: number;

  phone?: string;
  website?: string;
  logoUrl?: string;

  status?: "pending" | "approved" | "rejected";
  ownerUid?: string | null;
  ownerEmail?: string | null;

  rating?: number;
  reviewCount?: number;
  verified?: boolean;
}
