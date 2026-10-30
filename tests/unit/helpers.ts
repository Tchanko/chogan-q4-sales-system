import { computeEnrollmentState } from "@/lib/enrollment";
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
  cohort: "2026-11",
  consentTerms: true,
  consentEarlyStart: true,
  consentMarketing: false,
  ...humanMeta,
  attribution: { utmSource: "instagram" },
};

/** Session 2 : réservation de place et conditions acceptées. */
export const validSession2Registration = {
  ...validRegistration,
  cohort: "2026-12",
  consentDeposit: true,
};

const config = { manuallyOpen: true, deadlineIso: null };

/** Session 1 ouverte, aucune inscription confirmée. */
export const openEnrollment = computeEnrollmentState(new Date("2026-10-30T12:00:00Z"), config, {});

/** Session 1 close (date limite dépassée), Session 2 ouverte. */
export const session2Enrollment = computeEnrollmentState(new Date("2026-11-10T12:00:00Z"), config, {});
