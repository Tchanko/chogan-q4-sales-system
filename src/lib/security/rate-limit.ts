/**
 * Limitation de débit par fenêtre fixe.
 *
 * - Toujours : compteur en mémoire (par instance serveur).
 * - En plus, si Supabase est configuré : compteur partagé en base
 *   (fonction SQL hit_rate_limit), utile sur un hébergement « serverless »
 *   où chaque instance a sa propre mémoire.
 *
 * L'identifiant (adresse IP) n'est jamais stocké en clair : seule une
 * empreinte HMAC sert de clé.
 */

export interface RateLimitRule {
  name: string;
  max: number;
  windowSeconds: number;
}

export const RATE_LIMITS = {
  lead: { name: "lead", max: 5, windowSeconds: 10 * 60 },
  registration: { name: "registration", max: 5, windowSeconds: 10 * 60 },
  unsubscribe: { name: "unsubscribe", max: 10, windowSeconds: 10 * 60 },
  adminLogin: { name: "admin-login", max: 5, windowSeconds: 15 * 60 },
} satisfies Record<string, RateLimitRule>;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

interface Bucket {
  windowStart: number;
  hits: number;
}

const STORE_KEY = Symbol.for("cq4.rateLimit.store");

function store(): Map<string, Bucket> {
  const g = globalThis as unknown as Record<symbol, Map<string, Bucket> | undefined>;
  return (g[STORE_KEY] ??= new Map());
}

export function hitMemoryLimit(
  rule: RateLimitRule,
  key: string,
  now: number = Date.now(),
): RateLimitResult {
  const windowMs = rule.windowSeconds * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const map = store();
  const id = `${rule.name}:${key}`;
  const bucket = map.get(id);

  if (!bucket || bucket.windowStart !== windowStart) {
    map.set(id, { windowStart, hits: 1 });
    if (map.size > 10_000) purge(map, now);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  bucket.hits += 1;
  const allowed = bucket.hits <= rule.max;
  return {
    allowed,
    retryAfterSeconds: allowed ? 0 : Math.ceil((windowStart + windowMs - now) / 1000),
  };
}

function purge(map: Map<string, Bucket>, now: number) {
  for (const [id, bucket] of map) {
    if (now - bucket.windowStart > 24 * 3600 * 1000) map.delete(id);
  }
}

export interface SharedRateLimiter {
  hitRateLimit(key: string, windowSeconds: number, max: number): Promise<boolean>;
}

/**
 * Applique la limite en mémoire puis, si disponible, la limite partagée.
 * En cas d'erreur de la base, la limite mémoire reste appliquée.
 */
export async function checkRateLimit(
  rule: RateLimitRule,
  key: string,
  shared: SharedRateLimiter | null,
): Promise<RateLimitResult> {
  const local = hitMemoryLimit(rule, key);
  if (!local.allowed) return local;
  if (!shared) return local;
  try {
    const allowed = await shared.hitRateLimit(`${rule.name}:${key}`, rule.windowSeconds, rule.max);
    return { allowed, retryAfterSeconds: allowed ? 0 : rule.windowSeconds };
  } catch {
    return local;
  }
}

/** Réinitialise les compteurs en mémoire (tests). */
export function resetRateLimits(): void {
  store().clear();
}
