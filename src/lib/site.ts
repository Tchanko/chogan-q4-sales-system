/**
 * Configuration publique (variables NEXT_PUBLIC_*, intégrées au moment du build).
 * Ne JAMAIS placer de secret ici.
 */
import { offer } from "@/content/offer";

function digitsOnly(value: string | undefined): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      /* valeur invalide : repli ci-dessous */
    }
  }
  return "http://localhost:3000";
}

export const site = {
  url: siteUrl(),
  name: offer.name,
  /** Numéro WhatsApp professionnel, format international sans « + » (ex. 33612345678). */
  whatsappNumber: digitsOnly(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
  /** « form » : CTA vers /inscription ; « whatsapp » : CTA vers une conversation WhatsApp. */
  registrationMode:
    process.env.NEXT_PUBLIC_REGISTRATION_MODE === "whatsapp" ? ("whatsapp" as const) : ("form" as const),
  /** Indexation par les moteurs de recherche (désactivée tant que le site n'est pas prêt). */
  allowIndexing: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true",
  tracking: {
    ga4Id: process.env.NEXT_PUBLIC_GA4_ID?.trim() || null,
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || null,
    tiktokPixelId: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID?.trim() || null,
  },
};

export const trackingConfigured = Boolean(
  site.tracking.ga4Id || site.tracking.metaPixelId || site.tracking.tiktokPixelId,
);

/** Lien WhatsApp avec message prérempli (sans donnée personnelle), ou null si non configuré. */
export function whatsappUrl(message: string): string | null {
  if (!site.whatsappNumber) return null;
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const whatsappMessages = {
  leadMagnet: `Bonjour, je souhaite recevoir le mini-atelier gratuit « ${offer.leadMagnet.title.replace("Mini-atelier : ", "")} ».`,
  question: `Bonjour, j'ai une question sur la formation ${offer.name}.`,
  join: `Bonjour, je souhaite rejoindre la formation ${offer.name}.`,
  registration: (reference: string) =>
    `Bonjour, je viens d'envoyer ma demande d'inscription à ${offer.name}. Ma référence : ${reference}.`,
};

/** Destination du bouton principal « Je veux rejoindre… ». */
export function joinHref(): string {
  if (site.registrationMode === "whatsapp") {
    return whatsappUrl(whatsappMessages.join) ?? "/inscription";
  }
  return "/inscription";
}
