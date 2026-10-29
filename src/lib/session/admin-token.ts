/**
 * Jeton de session d'administration (logique pure, utilisable par le proxy).
 * Cookie signé HttpOnly, SameSite=Strict, limité au chemin /admin, 8 heures.
 */
import { createSignedToken, verifySignedToken } from "@/lib/security/signing";

export const ADMIN_COOKIE = "cq4_admin";
export const ADMIN_COOKIE_PATH = "/admin";
export const ADMIN_SESSION_SECONDS = 8 * 3600;

export function issueAdminToken(secret: string): string {
  return createSignedToken("admin", { role: "admin" }, ADMIN_SESSION_SECONDS, secret);
}

export function isValidAdminToken(token: string | undefined, secret: string): boolean {
  const payload = verifySignedToken<{ role?: unknown }>("admin", token, secret);
  return payload?.role === "admin";
}
