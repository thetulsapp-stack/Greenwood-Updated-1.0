"use client";

import Image from "next/image";
import Link from "next/link";
import type { BusinessRecord } from "@/lib/business";
import { formatPhone } from "@/lib/format";

function Flowers({ rating = 0 }: { rating?: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return (
    <div className="flex items-center gap-1 text-sm" aria-label={`Rated ${rounded} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rounded ? "text-[var(--accent)]" : "text-[#dfd8c8]"}>✿</span>
      ))}
    </div>
  );
}

export default function BusinessCard({ business }: { business: BusinessRecord }) {
  return (
    <Link href={`/business/${business.id}`} className="group flex h-full flex-col rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow)]">
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)]">
          {business.logoUrl ? (
            <Image src={business.logoUrl} alt={business.name} fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-xl font-semibold text-[var(--primary)]">✿</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="line-clamp-2 text-lg font-semibold text-[var(--text)] group-hover:text-[var(--primary)]">{business.name}</h3>
              <p className="mt-1 text-sm font-medium text-[var(--primary)]">{business.categoryGroup || business.category || "Business"}</p>
            </div>
            {typeof business.distanceMiles === "number" ? (
              <span className="rounded-full bg-[var(--surface-alt)] px-2 py-1 text-xs font-semibold text-[var(--muted)]">{business.distanceMiles.toFixed(1)} mi</span>
            ) : null}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
            <Flowers rating={business.rating} />
            <span>({business.reviewCount || 0} reviews)</span>
            {business.verified ? <span className="rounded-full bg-[rgba(28,124,84,.12)] px-2 py-1 text-[var(--success)]">Verified</span> : null}
          </div>
        </div>
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{business.description || "No description available yet."}</p>
      <div className="mt-5 space-y-2 text-sm text-[var(--muted)]">
        {business.address ? <p className="line-clamp-1">📍 {[business.address, business.city].filter(Boolean).join(", ")}</p> : null}
        {business.phone ? <p>☎ {formatPhone(business.phone)}</p> : null}
      </div>
      <div className="mt-5 flex items-center justify-between text-sm font-semibold text-[var(--primary)]">
        <span>View details</span>
        <span>→</span>
      </div>
    </Link>
  );
}
