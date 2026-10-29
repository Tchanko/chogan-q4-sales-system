/**
 * Types et constantes métier partagés (client + serveur).
 */

export const CHALLENGES = [
  { id: "quoi_publier", label: "Je ne sais pas quoi publier" },
  { id: "visuels", label: "Mes visuels ou vidéos manquent d'impact" },
  { id: "prospects", label: "Je publie mais j'attire peu de prospects" },
  { id: "ia", label: "Je ne sais pas utiliser l'IA pour créer du contenu" },
  { id: "facebook_ads", label: "Je ne sais pas lancer une campagne Facebook Ads" },
  { id: "temps", label: "Je manque de temps pour créer du contenu" },
  { id: "autre", label: "Autre difficulté" },
] as const;

export type ChallengeId = (typeof CHALLENGES)[number]["id"];

export const CHALLENGE_IDS = CHALLENGES.map((c) => c.id) as [ChallengeId, ...ChallengeId[]];

export function challengeLabel(id: string): string {
  return CHALLENGES.find((c) => c.id === id)?.label ?? id;
}

/** Données d'acquisition (premier contact de la session). */
export interface Attribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  /** Domaine du site référent uniquement (jamais l'URL complète). */
  referrerHost: string | null;
  landingPath: string | null;
}

export const EMPTY_ATTRIBUTION: Attribution = {
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  utmTerm: null,
  referrerHost: null,
  landingPath: null,
};

/** Source d'acquisition lisible pour le tableau de bord. */
export function acquisitionSource(a: Pick<Attribution, "utmSource" | "referrerHost">): string {
  return (a.utmSource ?? a.referrerHost ?? "direct").toLowerCase();
}

export type LeadStatus = "new" | "contacted" | "unsubscribed";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  unsubscribed: "Désinscrit",
};

/**
 * Cycle de vie d'une inscription :
 * - request_received : demande reçue, aucun paiement vérifié ;
 * - payment_pending  : instructions envoyées ou paiement déclaré, en attente de vérification ;
 * - confirmed        : paiement effectivement vérifié (manuellement ou par un prestataire) ;
 * - cancelled        : demande annulée.
 */
export const REGISTRATION_STATUSES = [
  "request_received",
  "payment_pending",
  "confirmed",
  "cancelled",
] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  request_received: "Demande reçue",
  payment_pending: "Paiement en attente de vérification",
  confirmed: "Inscription confirmée",
  cancelled: "Annulée",
};

/**
 * Changements de statut autorisés depuis l'administration (hors confirmation,
 * qui passe obligatoirement par une vérification de paiement).
 */
export const REGISTRATION_TRANSITIONS: Record<RegistrationStatus, RegistrationStatus[]> = {
  request_received: ["payment_pending", "cancelled"],
  payment_pending: ["request_received", "cancelled"],
  // Correction d'une erreur ou remboursement.
  confirmed: ["payment_pending", "cancelled"],
  cancelled: ["request_received"],
};

export type PaymentVerificationSource = "manual" | "provider";
