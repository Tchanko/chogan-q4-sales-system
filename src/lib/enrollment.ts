/**
 * Ouverture des inscriptions, session par session.
 *
 * Une session (promotion) est ouverte aux inscriptions si et seulement si :
 * - l'interrupteur manuel ENROLLMENT_OPEN n'est pas à « false » ;
 * - ses places ne sont pas toutes prises (inscriptions CONFIRMÉES uniquement) ;
 * - sa date limite (démarrage + 3 jours) n'est pas dépassée ;
 * - les sessions précédentes sont fermées (complètes ou date limite dépassée).
 * Une seule session est donc ouverte à la fois, et l'offre se ferme d'elle-même
 * après la dernière session : elle ne peut pas rester active par oubli.
 */
import { findCohort, offer, type Cohort } from "@/content/offer";

/**
 * - open : inscriptions ouvertes ;
 * - waiting : ouvrira quand la session précédente sera fermée ;
 * - full : toutes les places sont confirmées ;
 * - deadline_passed : date limite dépassée.
 */
export type CohortStatus = "open" | "waiting" | "full" | "deadline_passed";

export type EnrollmentReason = "open" | "manually_closed" | "closed";

export interface CohortAvailability {
  id: string;
  capacity: number;
  /** Inscriptions confirmées ; null si le stockage est indisponible (aucun compteur affiché). */
  confirmed: number | null;
  remaining: number | null;
  deadlineIso: string;
  status: CohortStatus;
}

export interface EnrollmentState {
  open: boolean;
  reason: EnrollmentReason;
  /** Session ouverte aux inscriptions, sinon null. */
  cohortId: string | null;
  /** Date limite de la session ouverte, sinon null. */
  deadlineIso: string | null;
  cohorts: CohortAvailability[];
}

/** Nombre d'inscriptions confirmées par session (identifiant de session → nombre). */
export type ConfirmedCounts = Readonly<Record<string, number>>;

export interface EnrollmentConfig {
  manuallyOpen: boolean;
  /** Remplace la date limite de la Session 1 si elle est valide. */
  deadlineIso: string | null;
}

export function resolveDeadline(cohort: Cohort, override: string | null): Date {
  if (override) {
    const parsed = new Date(override);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    console.warn("[inscriptions] ENROLLMENT_DEADLINE invalide, date par défaut utilisée.");
  }
  return new Date(cohort.enrollmentDeadlineIso);
}

export function computeEnrollmentState(
  now: Date,
  config: EnrollmentConfig,
  confirmed: ConfirmedCounts | null,
): EnrollmentState {
  let previousStillOpen = false;
  const cohorts = offer.cohorts.map((cohort, index): CohortAvailability => {
    const deadline = resolveDeadline(cohort, index === 0 ? config.deadlineIso : null);
    const count = confirmed ? (confirmed[cohort.id] ?? 0) : null;
    const remaining = count === null ? null : Math.max(0, cohort.capacity - count);
    let status: CohortStatus;
    if (remaining === 0) status = "full";
    else if (now.getTime() > deadline.getTime()) status = "deadline_passed";
    else if (previousStillOpen) status = "waiting";
    else status = "open";
    if (status === "open" || status === "waiting") previousStillOpen = true;
    return {
      id: cohort.id,
      capacity: cohort.capacity,
      confirmed: count,
      remaining,
      deadlineIso: deadline.toISOString(),
      status,
    };
  });

  const current = cohorts.find((c) => c.status === "open") ?? null;
  if (!config.manuallyOpen) {
    return { open: false, reason: "manually_closed", cohortId: null, deadlineIso: null, cohorts };
  }
  if (!current) return { open: false, reason: "closed", cohortId: null, deadlineIso: null, cohorts };
  return { open: true, reason: "open", cohortId: current.id, deadlineIso: current.deadlineIso, cohorts };
}

/**
 * Session mise en avant sur les pages : celle qui est ouverte, sinon la
 * prochaine qui pourrait ouvrir, sinon la dernière.
 */
export function focusCohort(state: EnrollmentState): { cohort: Cohort; availability: CohortAvailability } {
  const availability =
    state.cohorts.find((c) => c.id === state.cohortId) ??
    state.cohorts.find((c) => c.status === "open" || c.status === "waiting") ??
    state.cohorts[state.cohorts.length - 1];
  return { cohort: findCohort(availability.id)!, availability };
}

export function cohortAvailability(state: EnrollmentState, id: string): CohortAvailability | undefined {
  return state.cohorts.find((c) => c.id === id);
}

/** Date limite au format lisible (heure de Paris). */
export function formatDeadline(deadlineIso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(deadlineIso));
}

/** « 7 places restantes sur 10 », « 1 place restante sur 10 », « Complet ». */
export function seatsLabel(availability: CohortAvailability): string | null {
  if (availability.remaining === null) return null;
  if (availability.remaining === 0) return "Complet";
  const s = availability.remaining > 1 ? "s" : "";
  return `${availability.remaining} place${s} restante${s} sur ${availability.capacity}`;
}
