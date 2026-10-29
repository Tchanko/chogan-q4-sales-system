import { NextResponse } from "next/server";
import { getAppSecret } from "@/lib/config/server-env";
import { getEnrollmentStateNow } from "@/lib/enrollment-server";
import { NO_STORE, guardedJsonPost, isHttps, serviceErrorResponse } from "@/lib/http/api";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { submitRegistration } from "@/lib/services/registrations";
import {
  REGISTRATION_COOKIE,
  REGISTRATION_COOKIE_PATH,
  REGISTRATION_COOKIE_TTL_SECONDS,
  issueRegistrationToken,
} from "@/lib/session/registration-cookie";
import { getRepository } from "@/lib/storage";

/** Demande d'inscription (aucun paiement n'est traité ici). */
export async function POST(request: Request): Promise<Response> {
  const repo = getRepository();
  return guardedJsonPost(request, RATE_LIMITS.registration, repo, async (body) => {
    const secret = getAppSecret();
    const result = await submitRegistration(body, {
      repo,
      enrollment: getEnrollmentStateNow(),
      canIssueConfirmationCookie: secret !== null,
    });
    if (!result.ok) return serviceErrorResponse(result);

    const response = NextResponse.json(
      {
        ok: true,
        registrationId: result.value.registrationId,
        reference: result.value.reference,
      },
      { status: 201, headers: NO_STORE },
    );
    response.cookies.set(REGISTRATION_COOKIE, issueRegistrationToken(result.value.registrationId, secret!), {
      httpOnly: true,
      sameSite: "lax",
      secure: isHttps(request),
      path: REGISTRATION_COOKIE_PATH,
      maxAge: REGISTRATION_COOKIE_TTL_SECONDS,
    });
    return response;
  });
}
