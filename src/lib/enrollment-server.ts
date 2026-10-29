import "server-only";
import { cacheLife } from "next/cache";
import { getEnrollmentConfig } from "@/lib/config/server-env";
import { computeEnrollmentState, type EnrollmentState } from "@/lib/enrollment";

/** État des inscriptions à l'instant présent (routes d'API, actions serveur). */
export function getEnrollmentStateNow(): EnrollmentState {
  return computeEnrollmentState(new Date(), getEnrollmentConfig());
}

/**
 * État des inscriptions pour l'affichage des pages, recalculé au plus
 * toutes les minutes. Les routes d'API revérifient toujours en temps réel.
 */
export async function getEnrollmentStateForPage(): Promise<EnrollmentState> {
  "use cache";
  cacheLife("minutes");
  return computeEnrollmentState(new Date(), getEnrollmentConfig());
}
