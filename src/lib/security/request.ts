/**
 * Garde-fous HTTP communs aux routes d'API publiques.
 */

/** Adresse IP du client, telle que transmise par l'hébergeur (proxy de confiance). */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export function clientIp(request: Request): string {
  return clientIpFromHeaders(request.headers);
}

/**
 * Vérifie que la requête provient bien du site lui-même (protection CSRF) :
 * l'en-tête Origin doit correspondre à l'hôte de la requête ou à
 * NEXT_PUBLIC_SITE_URL. Les requêtes sans Origin sont refusées.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  const allowed = new Set<string>();
  const host = request.headers.get("host");
  if (host) allowed.add(host.toLowerCase());
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) allowed.add(forwardedHost.split(",")[0].trim().toLowerCase());
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      allowed.add(new URL(siteUrl).host.toLowerCase());
    } catch {
      /* URL de site invalide : ignorée */
    }
  }
  return allowed.has(originHost);
}

export type BodyResult = { ok: true; body: unknown } | { ok: false; reason: "type" | "size" | "json" };

/** Lit un corps JSON en limitant sa taille (10 Ko par défaut). */
export async function readJsonBody(request: Request, maxBytes = 10_000): Promise<BodyResult> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) return { ok: false, reason: "type" };
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return { ok: false, reason: "size" };
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) return { ok: false, reason: "size" };
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, reason: "json" };
  }
}
