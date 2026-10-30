import { randomInt } from "node:crypto";
import { findCohort, offer } from "@/content/offer";
import { REGISTRATION_TRANSITIONS, type RegistrationStatus } from "@/lib/domain";
import type { EnrollmentState } from "@/lib/enrollment";
import { checkHumanSignals } from "@/lib/security/anti-bot";
import { CohortFullError, DuplicateReferenceError, type Repository } from "@/lib/storage/types";
import { normalizeWhatsApp } from "@/lib/validation/phone";
import {
  normalizeAttribution,
  registrationFormSchema,
  submissionMetaSchema,
  toFieldErrors,
} from "@/lib/validation/schemas";
import { failure, success, type ServiceResult } from "./result";

/** Alphabet sans caractères ambigus (0/O, 1/I/L). */
const REFERENCE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Référence lisible à communiquer sur WhatsApp, ex. CQ4-7KX2PM. */
export function generateReference(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return `CQ4-${code}`;
}

export interface RegistrationDeps {
  repo: Repository | null;
  enrollment: EnrollmentState;
  /** Le secret de signature des cookies est-il configuré ? */
  canIssueConfirmationCookie: boolean;
  makeReference?: () => string;
}

export interface RegistrationSubmitted {
  registrationId: string;
  reference: string;
}

/**
 * Enregistre une demande d'inscription (statut « demande reçue ») pour la
 * session ouverte. Une demande ne réserve aucune place : seules les
 * inscriptions confirmées comptent. Aucun paiement n'est simulé ni considéré
 * comme acquis.
 */
export async function submitRegistration(
  body: unknown,
  deps: RegistrationDeps,
): Promise<ServiceResult<RegistrationSubmitted>> {
  const cohort = deps.enrollment.open ? findCohort(deps.enrollment.cohortId) : undefined;
  if (!cohort) return failure("ENROLLMENT_CLOSED");

  const meta = submissionMetaSchema.safeParse(body);
  if (!meta.success || checkHumanSignals(meta.data) !== "ok") return failure("BOT_SUSPECTED");

  const parsed = registrationFormSchema.safeParse(body);
  if (!parsed.success) return failure("VALIDATION", toFieldErrors(parsed.error));
  // La session affichée au visiteur a fermé entre-temps (complète ou date limite) :
  // il doit voir les conditions de la session suivante avant de s'y inscrire.
  if (parsed.data.cohort !== cohort.id) return failure("COHORT_CHANGED");

  if (!deps.repo) return failure("STORAGE_UNAVAILABLE");
  if (!deps.canIssueConfirmationCookie) return failure("CONFIG_INCOMPLETE");

  const v = parsed.data;
  const whatsapp = normalizeWhatsApp(v.phone, v.phoneCountry);
  if (!whatsapp) return failure("VALIDATION", { phone: "Numéro WhatsApp invalide." });

  const makeReference = deps.makeReference ?? generateReference;
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = makeReference();
    try {
      const { id } = await deps.repo.createRegistration({
        reference,
        cohort: cohort.id,
        fullName: v.fullName,
        whatsapp,
        email: v.email || null,
        country: v.country.toUpperCase(),
        paymentMethod: v.paymentMethod,
        priceCents: offer.price.amountCents,
        depositCents: cohort.deposit?.amountCents ?? null,
        currency: offer.price.currency,
        termsVersion: offer.legal.termsVersion,
        consentEarlyStart: v.consentEarlyStart === true,
        consentDeposit: cohort.deposit !== null && v.consentDeposit === true,
        consentMarketing: v.consentMarketing === true,
        attribution: normalizeAttribution(meta.data.attribution),
      });
      return success({ registrationId: id, reference });
    } catch (error) {
      if (error instanceof DuplicateReferenceError) continue;
      console.error("[inscriptions] enregistrement impossible", (error as Error).message);
      return failure("INTERNAL");
    }
  }
  return failure("INTERNAL");
}

/* ------------------------------------------------------------------ */
/* Gestion des statuts (administration)                                 */
/* ------------------------------------------------------------------ */

/**
 * Change le statut sans confirmation de paiement. La confirmation passe
 * obligatoirement par confirmManualPayment ou applyProviderPayment.
 */
export async function changeRegistrationStatus(
  repo: Repository,
  id: string,
  next: RegistrationStatus,
): Promise<ServiceResult<null>> {
  if (next === "confirmed") return failure("INVALID_TRANSITION");
  const current = await repo.getRegistration(id);
  if (!current) return failure("NOT_FOUND");
  if (!REGISTRATION_TRANSITIONS[current.status].includes(next)) return failure("INVALID_TRANSITION");
  const leavingConfirmed = current.status === "confirmed";
  await repo.updateRegistration(id, {
    status: next,
    ...(leavingConfirmed
      ? {
          paymentVerifiedAt: null,
          paymentVerificationSource: null,
          paymentProvider: null,
          balanceVerifiedAt: null,
          balanceReference: null,
        }
      : {}),
  });
  return success(null);
}

function passesLuhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

function passesIbanChecksum(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const chunk = /\d/.test(ch) ? ch : String(ch.charCodeAt(0) - 55);
    for (const digit of chunk) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

/**
 * Détecte une saisie qui ressemble à un numéro de carte (13 à 19 chiffres
 * valides selon Luhn) ou à un IBAN (somme de contrôle valide). Les
 * références de transaction Mobile Money, même longues, restent acceptées.
 */
export function looksLikeBankData(value: string): boolean {
  for (const match of value.matchAll(/\d(?:[ -]?\d){12,18}/g)) {
    const digits = match[0].replace(/[ -]/g, "");
    if (digits.length >= 13 && digits.length <= 19 && passesLuhn(digits)) return true;
  }
  const compact = value.toUpperCase().replace(/[\s-]/g, "");
  for (const match of compact.matchAll(/[A-Z]{2}\d{2}[A-Z0-9]{11,30}/g)) {
    if (passesIbanChecksum(match[0])) return true;
  }
  return false;
}

export interface ManualConfirmationInput {
  paymentReference: string;
  note?: string;
  /** Case « J'ai vérifié la réception effective du paiement ». */
  verified: boolean;
}

/** Contrôle commun aux vérifications manuelles (paiement, réservation, solde). */
function validateManualProof(input: ManualConfirmationInput): {
  reference: string;
  note: string;
  errors: Record<string, string> | null;
} {
  const reference = input.paymentReference.trim();
  const note = input.note?.trim() ?? "";
  const errors: Record<string, string> = {};
  if (!input.verified) errors.verified = "Confirme avoir vérifié la réception effective du paiement.";
  if (reference.length < 3 || reference.length > 200)
    errors.paymentReference = "Indique la référence de la transaction (3 à 200 caractères).";
  else if (looksLikeBankData(reference))
    errors.paymentReference =
      "Cette saisie ressemble à un numéro de carte ou à un IBAN : ne les enregistre jamais. S'il s'agit bien d'un identifiant de transaction, sépare-le en deux parties avec « / ».";
  if (note.length > 1000) errors.note = "Note trop longue (1000 caractères maximum).";
  else if (note && looksLikeBankData(note))
    errors.note = "Ne saisis jamais de numéro de carte ni d'IBAN.";
  return { reference, note, errors: Object.keys(errors).length > 0 ? errors : null };
}

/**
 * Confirmation manuelle par l'administrateur, après vérification effective
 * de la réception du paiement (relevé bancaire, Mobile Money…). Pour la
 * Session 2, il s'agit de la réservation de place : elle suffit à confirmer
 * la place, le solde est vérifié ensuite (confirmBalancePayment).
 * Refusée si la session a déjà toutes ses places confirmées.
 */
export async function confirmManualPayment(
  repo: Repository,
  id: string,
  input: ManualConfirmationInput,
  now: Date = new Date(),
): Promise<ServiceResult<null>> {
  const { reference, note, errors } = validateManualProof(input);
  if (errors) return failure("VALIDATION", errors);

  const current = await repo.getRegistration(id);
  if (!current) return failure("NOT_FOUND");
  if (current.status === "cancelled" || current.status === "confirmed")
    return failure("INVALID_TRANSITION");

  const cohort = findCohort(current.cohort);
  if (cohort) {
    const confirmed = (await repo.countConfirmedByCohort())[cohort.id] ?? 0;
    if (confirmed >= cohort.capacity) return failure("SESSION_FULL");
  }

  try {
    await repo.updateRegistration(id, {
      status: "confirmed",
      paymentVerifiedAt: now.toISOString(),
      paymentVerificationSource: "manual",
      paymentProvider: null,
      paymentReference: reference,
      ...(note ? { adminNote: note } : {}),
    });
  } catch (error) {
    // Deux confirmations simultanées pour la dernière place : le stockage tranche.
    if (error instanceof CohortFullError) return failure("SESSION_FULL");
    throw error;
  }
  return success(null);
}

/**
 * Session 2 : vérification manuelle du paiement du solde, une fois la
 * réservation confirmée.
 */
export async function confirmBalancePayment(
  repo: Repository,
  id: string,
  input: ManualConfirmationInput,
  now: Date = new Date(),
): Promise<ServiceResult<null>> {
  const { reference, note, errors } = validateManualProof(input);
  if (errors) return failure("VALIDATION", errors);

  const current = await repo.getRegistration(id);
  if (!current) return failure("NOT_FOUND");
  if (current.status !== "confirmed" || current.depositCents === null || current.balanceVerifiedAt)
    return failure("INVALID_TRANSITION");

  await repo.updateRegistration(id, {
    status: "confirmed",
    balanceVerifiedAt: now.toISOString(),
    balanceReference: reference,
    ...(note ? { adminNote: note } : {}),
  });
  return success(null);
}
