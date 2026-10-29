/**
 * Jetons signés (HMAC-SHA256) pour les cookies de session.
 * Format : base64url(JSON) "." base64url(signature)
 * La signature inclut un « usage » pour qu'un jeton d'inscription ne puisse
 * jamais servir de session d'administration, et inversement.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export type TokenPurpose = "registration" | "admin";

interface TokenPayload {
  /** Expiration (millisecondes depuis l'époque Unix). */
  exp: number;
  [key: string]: unknown;
}

function sign(purpose: TokenPurpose, body: string, secret: string): string {
  return createHmac("sha256", secret).update(`${purpose}.${body}`).digest("base64url");
}

export function createSignedToken(
  purpose: TokenPurpose,
  data: Record<string, unknown>,
  ttlSeconds: number,
  secret: string,
  now: Date = new Date(),
): string {
  const payload: TokenPayload = { ...data, exp: now.getTime() + ttlSeconds * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(purpose, body, secret)}`;
}

export function verifySignedToken<T extends Record<string, unknown>>(
  purpose: TokenPurpose,
  token: string | undefined | null,
  secret: string,
  now: Date = new Date(),
): (T & TokenPayload) | null {
  if (!token || token.length > 2048) return null;
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(purpose, body, secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T & TokenPayload;
    if (typeof payload.exp !== "number" || payload.exp <= now.getTime()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Comparaison de secrets en temps constant (longueurs différentes comprises). */
export function safeEqual(a: string, b: string, secret: string): boolean {
  const ha = createHmac("sha256", secret).update(a).digest();
  const hb = createHmac("sha256", secret).update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Empreinte non réversible d'un identifiant (ex. adresse IP) pour la limitation de débit. */
export function fingerprint(value: string, secret: string): string {
  return createHmac("sha256", secret).update(`fp.${value}`).digest("base64url").slice(0, 32);
}
