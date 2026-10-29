/**
 * Ouverture des inscriptions.
 *
 * Les inscriptions sont ouvertes si et seulement si :
 * - l'interrupteur manuel ENROLLMENT_OPEN n'est pas à « false » ;
 * - la date limite (ENROLLMENT_DEADLINE, sinon celle de src/content/offer.ts)
 *   n'est pas dépassée.
 * Par défaut, l'offre se ferme donc d'elle-même : elle ne peut pas rester
 * active après la période d'inscription par oubli.
 */
import { offer } from "@/content/offer";

export type EnrollmentReason = "open" | "manually_closed" | "deadline_passed";

export interface EnrollmentState {
  open: boolean;
  reason: EnrollmentReason;
  deadlineIso: string;
}

export function resolveDeadline(deadlineIso: string | null): Date {
  if (deadlineIso) {
    const parsed = new Date(deadlineIso);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    console.warn("[inscriptions] ENROLLMENT_DEADLINE invalide, date par défaut utilisée.");
  }
  return new Date(offer.cohort.enrollmentDeadlineIso);
}

export function computeEnrollmentState(
  now: Date,
  config: { manuallyOpen: boolean; deadlineIso: string | null },
): EnrollmentState {
  const deadline = resolveDeadline(config.deadlineIso);
  const deadlineIso = deadline.toISOString();
  if (!config.manuallyOpen) return { open: false, reason: "manually_closed", deadlineIso };
  if (now.getTime() > deadline.getTime()) return { open: false, reason: "deadline_passed", deadlineIso };
  return { open: true, reason: "open", deadlineIso };
}

/** Date limite au format lisible (heure de Paris). */
export function formatDeadline(deadlineIso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(deadlineIso));
}
