import { NO_STORE, guardedJsonPost, serviceErrorResponse } from "@/lib/http/api";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { submitLead } from "@/lib/services/leads";
import { getRepository } from "@/lib/storage";

/** Formulaire de capture (page d'accueil). */
export async function POST(request: Request): Promise<Response> {
  const repo = getRepository();
  return guardedJsonPost(request, RATE_LIMITS.lead, repo, async (body) => {
    const result = await submitLead(body, repo);
    if (!result.ok) return serviceErrorResponse(result);
    return Response.json(
      { ok: true, leadId: result.value.leadId },
      { status: 201, headers: NO_STORE },
    );
  });
}
