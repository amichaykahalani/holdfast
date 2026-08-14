import type { Metadata } from "next";
import { Rubik, Geist_Mono } from "next/font/google";
import "./globals.css";

// Rubik: proper Hebrew + Latin support (Geist Sans has no Hebrew glyphs at
// all — Google Fonts doesn't offer a Hebrew subset for it). Geist Mono is
// kept for tabular numeric figures only, where script coverage doesn't
// matter since it's digits.
const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Holdfast",
  description: "אסקרו לפרילנסרים — קבלו תשלום בלי לרדוף אחרי חשבוניות.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${rubik.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
