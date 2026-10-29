import { NO_STORE, guardedJsonPost, serviceErrorResponse } from "@/lib/http/api";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { submitUnsubscribe } from "@/lib/services/unsubscribe";
import { getRepository } from "@/lib/storage";

/** Désinscription des communications marketing. */
export async function POST(request: Request): Promise<Response> {
  const repo = getRepository();
  return guardedJsonPost(request, RATE_LIMITS.unsubscribe, repo, async (body) => {
    const result = await submitUnsubscribe(body, repo);
    if (!result.ok) return serviceErrorResponse(result);
    return Response.json({ ok: true }, { status: 200, headers: NO_STORE });
  });
}
