import { JsonRepository, memoryPersistence } from "@/lib/storage/json-repository";

export function memoryRepo() {
  return new JsonRepository("memory", memoryPersistence());
}

/** Métadonnées d'un envoi « humain » (délai suffisant, champ piège vide). */
export const humanMeta = { hp: "", elapsedMs: 8000 };

export const validLead = {
  firstName: "Awa",
  email: "",
  phoneCountry: "CI",
  phone: "07 07 12 34 56",
  challenge: "ia",
  consent: true,
  ...humanMeta,
  attribution: { utmSource: "facebook", utmCampaign: "q4", landingPath: "/" },
};

export const validRegistration = {
  fullName: "Awa Koné",
  email: "awa@example.com",
  phoneCountry: "FR",
  phone: "06 12 34 56 78",
  country: "FR",
  paymentMethod: "virement",
  consentTerms: true,
  consentEarlyStart: true,
  consentMarketing: false,
  ...humanMeta,
  attribution: { utmSource: "instagram" },
};

export const openEnrollment = {
  open: true,
  reason: "open" as const,
  deadlineIso: "2026-11-05T22:59:59.000Z",
};
