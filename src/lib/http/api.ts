import "server-only";
import { getAppSecret } from "@/lib/config/server-env";
import { checkRateLimit, type RateLimitRule, type SharedRateLimiter } from "@/lib/security/rate-limit";
import { clientIp, isSameOrigin, readJsonBody } from "@/lib/security/request";
import { fingerprint } from "@/lib/security/signing";
import { USER_MESSAGES, type ServiceResult } from "@/lib/services/result";
import type { Repository } from "@/lib/storage/types";

export const NO_STORE = { "Cache-Control": "no-store" } as const;

const STATUS_BY_CODE = {
  VALIDATION: 422,
  BOT_SUSPECTED: 400,
  STORAGE_UNAVAILABLE: 503,
  ENROLLMENT_CLOSED: 409,
  CONFIG_INCOMPLETE: 503,
  NOT_FOUND: 404,
  INVALID_TRANSITION: 409,
  INTERNAL: 500,
} as const;

export function jsonError(status: number, code: string, message: string, extra?: object): Response {
  return Response.json({ ok: false, code, message, ...extra }, { status, headers: NO_STORE });
}

export function serviceErrorResponse(result: Extract<ServiceResult<unknown>, { ok: false }>): Response {
  return jsonError(STATUS_BY_CODE[result.code], result.code, USER_MESSAGES[result.code], {
    ...(result.fieldErrors ? { fieldErrors: result.fieldErrors } : {}),
  });
}

export function sharedLimiter(repo: Repository | null): SharedRateLimiter | null {
  if (repo && "hitRateLimit" in repo && typeof repo.hitRateLimit === "function") {
    return repo as unknown as SharedRateLimiter;
  }
  return null;
}

/**
 * Enveloppe commune aux formulaires publics : origine, type et taille du
 * corps, puis limitation de débit par adresse IP (empreinte).
 */
export async function guardedJsonPost(
  request: Request,
  rule: RateLimitRule,
  repo: Repository | null,
  handler: (body: unknown) => Promise<Response>,
): Promise<Response> {
  if (!isSameOrigin(request)) return jsonError(403, "FORBIDDEN", "Requête refusée.");

  const body = await readJsonBody(request);
  if (!body.ok) return jsonError(400, "BAD_REQUEST", "Requête invalide.");

  const ip = clientIp(request);
  const key = fingerprint(ip, getAppSecret() ?? "cq4-rate-limit");
  // Sans adresse IP transmise par l'hébergeur, tous les visiteurs partagent le
  // même compteur : on l'élargit pour ne pas bloquer de vrais prospects.
  const effectiveRule = ip === "unknown" ? { ...rule, max: rule.max * 20 } : rule;
  const limit = await checkRateLimit(effectiveRule, key, sharedLimiter(repo));
  if (!limit.allowed) {
    return Response.json(
      {
        ok: false,
        code: "RATE_LIMITED",
        message: "Trop de tentatives. Patiente quelques minutes avant de réessayer.",
      },
      { status: 429, headers: { ...NO_STORE, "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  try {
    return await handler(body.body);
  } catch (error) {
    console.error(`[api:${rule.name}] erreur inattendue`, (error as Error).message);
    return jsonError(500, "INTERNAL", USER_MESSAGES.INTERNAL);
  }
}

/** La requête est-elle servie en HTTPS (directement ou derrière un proxy) ? */
export function isHttps(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0].trim() === "https";
  return new URL(request.url).protocol === "https:";
}
