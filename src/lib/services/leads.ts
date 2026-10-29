import { offer } from "@/content/offer";
import { checkHumanSignals } from "@/lib/security/anti-bot";
import type { Repository } from "@/lib/storage/types";
import { normalizeWhatsApp } from "@/lib/validation/phone";
import {
  leadFormSchema,
  normalizeAttribution,
  submissionMetaSchema,
  toFieldErrors,
} from "@/lib/validation/schemas";
import { failure, success, type ServiceResult } from "./result";

export interface LeadSubmitted {
  leadId: string;
  isNew: boolean;
}

/**
 * Traite le formulaire de capture : anti-robots, validation, enregistrement.
 * Ne renvoie un succès que si l'enregistrement a réellement eu lieu.
 */
export async function submitLead(
  body: unknown,
  repo: Repository | null,
): Promise<ServiceResult<LeadSubmitted>> {
  const meta = submissionMetaSchema.safeParse(body);
  if (!meta.success || checkHumanSignals(meta.data) !== "ok") return failure("BOT_SUSPECTED");

  const parsed = leadFormSchema.safeParse(body);
  if (!parsed.success) return failure("VALIDATION", toFieldErrors(parsed.error));

  if (!repo) return failure("STORAGE_UNAVAILABLE");

  const v = parsed.data;
  const whatsapp = normalizeWhatsApp(v.phone, v.phoneCountry);
  if (!whatsapp) return failure("VALIDATION", { phone: "Numéro WhatsApp invalide." });

  try {
    const saved = await repo.upsertLead({
      firstName: v.firstName,
      email: v.email || null,
      whatsapp,
      challenge: v.challenge,
      consentVersion: offer.legal.leadConsentVersion,
      attribution: normalizeAttribution(meta.data.attribution),
    });
    return success({ leadId: saved.id, isNew: saved.isNew });
  } catch (error) {
    console.error("[prospects] enregistrement impossible", (error as Error).message);
    return failure("INTERNAL");
  }
}
