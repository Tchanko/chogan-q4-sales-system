/**
 * Événements de conversion du tunnel.
 *
 * - Envoyés uniquement aux outils configurés ET acceptés par le visiteur.
 * - Dédoublonnés : un même événement (même clé) n'est jamais envoyé deux fois
 *   (par session pour les consultations et clics, définitivement pour les
 *   prospects, demandes d'inscription et paiements).
 * - `payment_confirmed` n'est déclenché que si un prestataire de paiement
 *   réel a confirmé le paiement (voir src/app/(public)/confirmation).
 */
import { readConsent } from "./consent";

export type FunnelEvent =
  | "view_sales_page"
  | "cta_click"
  | "lead_submitted"
  | "registration_requested"
  | "payment_confirmed";

/** Correspondance avec les événements standard de chaque outil. */
export const EVENT_MAP: Record<
  FunnelEvent,
  { ga4: string; meta: { name: string; custom: boolean }; tiktok: string }
> = {
  view_sales_page: { ga4: "view_item", meta: { name: "ViewContent", custom: false }, tiktok: "ViewContent" },
  cta_click: { ga4: "cta_click", meta: { name: "CTAClick", custom: true }, tiktok: "ClickButton" },
  lead_submitted: { ga4: "generate_lead", meta: { name: "Lead", custom: false }, tiktok: "SubmitForm" },
  registration_requested: {
    ga4: "registration_request",
    meta: { name: "SubmitApplication", custom: false },
    tiktok: "SubmitForm",
  },
  payment_confirmed: { ga4: "purchase", meta: { name: "Purchase", custom: false }, tiktok: "CompletePayment" },
};

type Params = Record<string, string | number | boolean | undefined>;

interface TrackWindow {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
  ttq?: { track: (name: string, params?: Params, opts?: { event_id?: string }) => void };
}

const memorySent = new Set<string>();

function storageFor(scope: "session" | "persistent"): Storage | null {
  try {
    return scope === "persistent" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function alreadySent(key: string, scope: "session" | "persistent"): boolean {
  if (memorySent.has(key)) return true;
  try {
    return storageFor(scope)?.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markSent(key: string, scope: "session" | "persistent"): void {
  memorySent.add(key);
  try {
    storageFor(scope)?.setItem(key, "1");
  } catch {
    /* ignoré */
  }
}

export interface TrackOptions {
  /** Identifiant de dédoublonnage (ex. identifiant du prospect). */
  dedupeKey: string;
  scope: "session" | "persistent";
}

/**
 * Envoie un événement aux outils autorisés. Renvoie true si au moins un
 * outil l'a reçu. Sans consentement, rien n'est envoyé ni mémorisé.
 */
export function trackEvent(event: FunnelEvent, params: Params, options: TrackOptions): boolean {
  if (typeof window === "undefined") return false;
  const consent = readConsent();
  if (!consent || (!consent.analytics && !consent.marketing)) return false;

  const key = `cq4_evt:${event}:${options.dedupeKey}`;
  if (alreadySent(key, options.scope)) return false;

  const w = window as unknown as TrackWindow;
  const mapping = EVENT_MAP[event];
  const eventId = `${event}:${options.dedupeKey}`;
  let delivered = false;

  if (consent.analytics && typeof w.gtag === "function") {
    w.gtag("event", mapping.ga4, params);
    delivered = true;
  }
  if (consent.marketing && typeof w.fbq === "function") {
    w.fbq(mapping.meta.custom ? "trackCustom" : "track", mapping.meta.name, params, { eventID: eventId });
    delivered = true;
  }
  if (consent.marketing && w.ttq && typeof w.ttq.track === "function") {
    w.ttq.track(mapping.tiktok, params, { event_id: eventId });
    delivered = true;
  }

  if (delivered) markSent(key, options.scope);
  return delivered;
}
