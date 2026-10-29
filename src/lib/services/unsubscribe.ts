import { checkHumanSignals } from "@/lib/security/anti-bot";
import type { Repository } from "@/lib/storage/types";
import { normalizeWhatsApp } from "@/lib/validation/phone";
import { submissionMetaSchema, toFieldErrors, unsubscribeFormSchema } from "@/lib/validation/schemas";
import { failure, success, type ServiceResult } from "./result";

/**
 * Enregistre une désinscription des communications marketing.
 * La réponse est identique que le contact soit connu ou non, pour ne pas
 * révéler la présence d'une personne dans la base.
 */
export async function submitUnsubscribe(
  body: unknown,
  repo: Repository | null,
): Promise<ServiceResult<null>> {
  const meta = submissionMetaSchema.safeParse(body);
  if (!meta.success || checkHumanSignals(meta.data) !== "ok") return failure("BOT_SUSPECTED");

  const parsed = unsubscribeFormSchema.safeParse(body);
  if (!parsed.success) return failure("VALIDATION", toFieldErrors(parsed.error));
  if (!repo) return failure("STORAGE_UNAVAILABLE");

  const v = parsed.data;
  const whatsapp = v.phone ? normalizeWhatsApp(v.phone, v.phoneCountry) : null;
  const email = v.email || null;

  try {
    await repo.recordOptOut({ whatsapp, email });
    return success(null);
  } catch (error) {
    console.error("[désinscription] enregistrement impossible", (error as Error).message);
    return failure("INTERNAL");
  }
}
