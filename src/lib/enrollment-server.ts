import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getEnrollmentConfig } from "@/lib/config/server-env";
import { computeEnrollmentState, type ConfirmedCounts, type EnrollmentState } from "@/lib/enrollment";
import { getRepository } from "@/lib/storage";

/** Étiquette de cache invalidée à chaque confirmation ou annulation (compteur de places). */
export const ENROLLMENT_CACHE_TAG = "enrollment";

/**
 * Inscriptions confirmées par session, lues dans le stockage. null si le
 * stockage est indisponible : aucun compteur n'est alors affiché.
 */
async function readConfirmedCounts(): Promise<ConfirmedCounts | null> {
  const repo = getRepository();
  if (!repo) return null;
  try {
    return await repo.countConfirmedByCohort();
  } catch (error) {
    console.error("[inscriptions] comptage des places impossible", (error as Error).message);
    return null;
  }
}

/** État des inscriptions à l'instant présent (routes d'API, actions serveur). */
export async function getEnrollmentStateNow(): Promise<EnrollmentState> {
  const counts = await readConfirmedCounts();
  return computeEnrollmentState(new Date(), getEnrollmentConfig(), counts);
}

/**
 * État des inscriptions pour l'affichage des pages, recalculé au plus toutes
 * les minutes et immédiatement après une confirmation (updateTag). Les routes
 * d'API et l'administration revérifient toujours en temps réel.
 */
export async function getEnrollmentStateForPage(): Promise<EnrollmentState> {
  "use cache";
  cacheLife("minutes");
  cacheTag(ENROLLMENT_CACHE_TAG);
  const counts = await readConfirmedCounts();
  return computeEnrollmentState(new Date(), getEnrollmentConfig(), counts);
}
