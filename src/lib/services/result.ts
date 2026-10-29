import type { FieldErrors } from "@/lib/validation/schemas";

export type ServiceErrorCode =
  | "VALIDATION"
  | "BOT_SUSPECTED"
  | "STORAGE_UNAVAILABLE"
  | "ENROLLMENT_CLOSED"
  | "CONFIG_INCOMPLETE"
  | "NOT_FOUND"
  | "INVALID_TRANSITION"
  | "INTERNAL";

export type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: ServiceErrorCode; fieldErrors?: FieldErrors };

export const success = <T>(value: T): ServiceResult<T> => ({ ok: true, value });

export const failure = <T = never>(
  code: ServiceErrorCode,
  fieldErrors?: FieldErrors,
): ServiceResult<T> => ({ ok: false, code, ...(fieldErrors ? { fieldErrors } : {}) });

/** Messages affichés à l'utilisateur : aucun détail technique. */
export const USER_MESSAGES: Record<ServiceErrorCode, string> = {
  VALIDATION: "Certains champs sont à corriger.",
  BOT_SUSPECTED:
    "Ta demande n'a pas pu être traitée. Patiente quelques secondes puis réessaie, ou écris-nous sur WhatsApp.",
  STORAGE_UNAVAILABLE:
    "L'enregistrement en ligne est momentanément indisponible. Ta demande n'a pas été enregistrée : écris-nous directement sur WhatsApp.",
  ENROLLMENT_CLOSED: "Les inscriptions pour cette session sont closes.",
  CONFIG_INCOMPLETE:
    "Les inscriptions en ligne ne sont pas encore ouvertes. Ta demande n'a pas été enregistrée : écris-nous sur WhatsApp.",
  NOT_FOUND: "Élément introuvable.",
  INVALID_TRANSITION: "Ce changement de statut n'est pas autorisé.",
  INTERNAL:
    "Une erreur est survenue. Ta demande n'a pas été enregistrée. Réessaie dans un instant ou écris-nous sur WhatsApp.",
};
