import type { Metadata } from "next";
import { offer } from "@/content/offer";

/**
 * Open Graph commun. Next.js remplace l'objet `openGraph` du layout dès
 * qu'une page définit le sien : chaque page passe donc par cette fonction
 * pour conserver l'image, le type, la langue et le nom du site.
 */
export function openGraph(page: { title: string; description: string; url?: string }): Metadata["openGraph"] {
  return {
    type: "website",
    locale: "fr_FR",
    siteName: offer.name,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${offer.name} — formation contenu et prospection pour consultants Chogan`,
      },
    ],
    ...page,
  };
}
