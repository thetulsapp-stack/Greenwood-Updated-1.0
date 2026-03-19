import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Greenwood | localgreenwood.com",
  description: "A sponsor-ready, mobile-first directory for Black-owned business discovery.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
