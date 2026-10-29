import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getAppSecret } from "@/lib/config/server-env";
import { createSignedToken, verifySignedToken } from "@/lib/security/signing";

/**
 * Cookie signé qui relie le navigateur à SA demande d'inscription, pour que
 * la page /confirmation affiche le statut réel sans exposer d'identifiant
 * dans l'URL. HttpOnly : illisible par le JavaScript de la page.
 */
export const REGISTRATION_COOKIE = "cq4_reg";
export const REGISTRATION_COOKIE_PATH = "/confirmation";
export const REGISTRATION_COOKIE_TTL_SECONDS = 90 * 24 * 3600;

export function issueRegistrationToken(registrationId: string, secret: string): string {
  return createSignedToken("registration", { rid: registrationId }, REGISTRATION_COOKIE_TTL_SECONDS, secret);
}

export function readRegistrationId(token: string | undefined, secret: string): string | null {
  const payload = verifySignedToken<{ rid?: unknown }>("registration", token, secret);
  return payload && typeof payload.rid === "string" ? payload.rid : null;
}

/** Identifiant de la demande liée à ce navigateur, ou null. */
export async function getRegistrationIdFromCookie(): Promise<string | null> {
  const token = (await cookies()).get(REGISTRATION_COOKIE)?.value;
  // La vérification compare l'expiration à l'heure courante : rendu à la requête.
  await connection();
  const secret = getAppSecret();
  if (!secret) return null;
  return readRegistrationId(token, secret);
}
