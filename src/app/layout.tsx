import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import { AttributionCapture } from "@/components/analytics/Tracking";
import { ConsentManager } from "@/components/consent/ConsentManager";
import { offer } from "@/content/offer";
import { openGraph } from "@/lib/seo";
import { site } from "@/lib/site";
import "./globals.css";

const sora = Sora({ variable: "--font-sora", subsets: ["latin"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${offer.name} — Formation contenu et prospection pour consultants Chogan`,
    template: `%s · ${offer.name}`,
  },
  description: offer.tagline,
  applicationName: offer.name,
  // Indexation désactivée tant que NEXT_PUBLIC_ALLOW_INDEXING n'est pas « true ».
  robots: site.allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: openGraph({ title: offer.name, description: offer.tagline }),
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" className={`${sora.variable} ${manrope.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenu"
          className="sr-only z-[60] rounded-lg bg-cyan px-4 py-3 font-bold text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Aller au contenu
        </a>
        {children}
        <AttributionCapture />
        <ConsentManager />
      </body>
    </html>
  );
}
