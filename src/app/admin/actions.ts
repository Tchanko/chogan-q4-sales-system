"use server";

import { refresh, updateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminConfig } from "@/lib/config/server-env";
import { LEAD_STATUS_LABELS, REGISTRATION_STATUSES, type LeadStatus, type RegistrationStatus } from "@/lib/domain";
import { ENROLLMENT_CACHE_TAG } from "@/lib/enrollment-server";
import { sharedLimiter } from "@/lib/http/api";
import { RATE_LIMITS, checkRateLimit } from "@/lib/security/rate-limit";
import { clientIpFromHeaders } from "@/lib/security/request";
import { fingerprint, safeEqual } from "@/lib/security/signing";
import { USER_MESSAGES } from "@/lib/services/result";
import {
  changeRegistrationStatus,
  confirmBalancePayment,
  confirmManualPayment,
  type ManualConfirmationInput,
} from "@/lib/services/registrations";
import type { ServiceResult } from "@/lib/services/result";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_PATH,
  ADMIN_SESSION_SECONDS,
  issueAdminToken,
  requireAdmin,
} from "@/lib/session/admin";
import { getRepository } from "@/lib/storage";

export interface ActionState {
  ok: boolean;
  message: string | null;
  fieldErrors?: Record<string, string | undefined>;
  /** Saisie renvoyée en cas d'erreur, pour ne pas la perdre. */
  values?: Record<string, string>;
}

/* --------------------------------------------------------------------- */
/* Connexion / déconnexion                                                */
/* --------------------------------------------------------------------- */

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const config = getAdminConfig();
  if (!config.enabled || !config.password || !config.secret) {
    return {
      ok: false,
      message:
        "L'administration n'est pas activée : définis ADMIN_PASSWORD (12 caractères minimum) et APP_SECRET.",
    };
  }
  const h = await headers();
  const key = fingerprint(clientIpFromHeaders(h), config.secret);
  const limit = await checkRateLimit(RATE_LIMITS.adminLogin, key, sharedLimiter(getRepository()));
  if (!limit.allowed) {
    return { ok: false, message: "Trop de tentatives. Réessaie dans quelques minutes." };
  }

  const password = String(formData.get("password") ?? "");
  if (!password || !safeEqual(password, config.password, config.secret)) {
    return { ok: false, message: "Mot de passe incorrect." };
  }

  const https = (h.get("x-forwarded-proto") ?? h.get("origin") ?? "").startsWith("https");
  (await cookies()).set(ADMIN_COOKIE, issueAdminToken(config.secret), {
    httpOnly: true,
    sameSite: "strict",
    secure: https,
    path: ADMIN_COOKIE_PATH,
    maxAge: ADMIN_SESSION_SECONDS,
  });
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  (await cookies()).set(ADMIN_COOKIE, "", { path: ADMIN_COOKIE_PATH, maxAge: 0 });
  redirect("/admin/connexion");
}

/* --------------------------------------------------------------------- */
/* Inscriptions                                                           */
/* --------------------------------------------------------------------- */

const STORAGE_ERROR: ActionState = { ok: false, message: USER_MESSAGES.STORAGE_UNAVAILABLE };

export async function registrationStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as RegistrationStatus;
  if (!id || !REGISTRATION_STATUSES.includes(status)) {
    return { ok: false, message: "Statut invalide." };
  }
  const repo = getRepository();
  if (!repo) return STORAGE_ERROR;
  const result = await changeRegistrationStatus(repo, id, status);
  if (!result.ok) return { ok: false, message: USER_MESSAGES[result.code] };
  // Une inscription confirmée qui change de statut libère une place : compteur à jour.
  updateTag(ENROLLMENT_CACHE_TAG);
  refresh();
  return { ok: true, message: "Statut mis à jour." };
}

type ManualConfirmation = (
  repo: NonNullable<ReturnType<typeof getRepository>>,
  id: string,
  input: ManualConfirmationInput,
) => Promise<ServiceResult<null>>;

async function runManualConfirmation(
  formData: FormData,
  confirm: ManualConfirmation,
  successMessage: string,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const repo = getRepository();
  if (!repo) return STORAGE_ERROR;
  const paymentReference = String(formData.get("paymentReference") ?? "");
  const note = String(formData.get("note") ?? "");
  const result = await confirm(repo, id, {
    paymentReference,
    note,
    verified: formData.get("verified") === "on",
  });
  if (!result.ok) {
    return {
      ok: false,
      message: result.code === "VALIDATION" ? "Vérifie les champs indiqués." : USER_MESSAGES[result.code],
      fieldErrors: result.fieldErrors,
      // La référence refusée comme donnée bancaire n'est pas renvoyée au navigateur.
      values: { paymentReference: result.fieldErrors?.paymentReference ? "" : paymentReference, note },
    };
  }
  updateTag(ENROLLMENT_CACHE_TAG);
  refresh();
  return { ok: true, message: successMessage };
}

export async function confirmPaymentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runManualConfirmation(
    formData,
    confirmManualPayment,
    "Paiement vérifié : la place est confirmée et le compteur est à jour.",
  );
}

export async function confirmBalanceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runManualConfirmation(formData, confirmBalancePayment, "Solde vérifié : l'inscription est complète.");
}

/* --------------------------------------------------------------------- */
/* Prospects                                                              */
/* --------------------------------------------------------------------- */

export async function leadStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as LeadStatus;
  // La désinscription ne se fait que via la page publique (preuve de la demande).
  if (!id || !(status in LEAD_STATUS_LABELS) || status === "unsubscribed") {
    return { ok: false, message: "Statut invalide." };
  }
  const repo = getRepository();
  if (!repo) return STORAGE_ERROR;
  try {
    await repo.updateLeadStatus(id, status);
  } catch {
    return { ok: false, message: USER_MESSAGES.INTERNAL };
  }
  refresh();
  return { ok: true, message: "Prospect mis à jour." };
}
