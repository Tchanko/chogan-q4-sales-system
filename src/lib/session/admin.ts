import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getAdminConfig } from "@/lib/config/server-env";
import { ADMIN_COOKIE, isValidAdminToken } from "./admin-token";

export { ADMIN_COOKIE, ADMIN_COOKIE_PATH, ADMIN_SESSION_SECONDS, issueAdminToken } from "./admin-token";

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  // La vérification compare l'expiration à l'heure courante : rendu à la requête.
  await connection();
  const config = getAdminConfig();
  if (!config.enabled || !config.secret) return false;
  return isValidAdminToken(token, config.secret);
}

/** À appeler en tête de toute page ou action d'administration. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) redirect("/admin/connexion");
}
