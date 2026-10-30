/**
 * Schémas de validation partagés entre le navigateur et le serveur.
 * Le serveur revalide systématiquement : la validation côté client n'est
 * qu'un confort pour l'utilisateur.
 */
import { z } from "zod";
import { CHALLENGE_IDS, type Attribution } from "@/lib/domain";
import { COHORT_IDS, PAYMENT_METHOD_IDS, findCohort, offer } from "@/content/offer";
import { isKnownCountry, normalizeWhatsApp } from "./phone";

const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;

const firstName = z
  .string({ error: "Indique ton prénom." })
  .trim()
  .min(2, { error: "Indique ton prénom (2 caractères minimum)." })
  .max(50, { error: "Ton prénom est trop long (50 caractères maximum)." })
  .regex(NAME_PATTERN, { error: "Utilise uniquement des lettres, espaces, apostrophes ou tirets." });

const fullName = z
  .string({ error: "Indique ton nom et ton prénom." })
  .trim()
  .min(3, { error: "Indique ton nom et ton prénom." })
  .max(100, { error: "Ce champ est trop long (100 caractères maximum)." })
  .regex(NAME_PATTERN, { error: "Utilise uniquement des lettres, espaces, apostrophes ou tirets." });

const optionalEmail = z
  .string()
  .trim()
  .max(254, { error: "Adresse e-mail trop longue." })
  .transform((v) => v.toLowerCase())
  .refine((v) => v === "" || z.email().safeParse(v).success, {
    error: "Adresse e-mail invalide.",
  });

const phoneCountry = z
  .string({ error: "Choisis l'indicatif du pays." })
  .trim()
  .refine(isKnownCountry, { error: "Choisis l'indicatif du pays." });

const phone = z
  .string({ error: "Indique ton numéro WhatsApp." })
  .trim()
  .min(1, { error: "Indique ton numéro WhatsApp." })
  .max(25, { error: "Numéro WhatsApp trop long." });

const PHONE_ERROR = "Numéro WhatsApp invalide. Vérifie l'indicatif du pays et le numéro.";

/**
 * Vérification du numéro (dépend de l'indicatif choisi). Exécutée même si
 * d'autres champs sont invalides, pour afficher toutes les erreurs d'un coup.
 */
function checkPhone(v: { phone?: unknown; phoneCountry?: unknown }, ctx: z.RefinementCtx) {
  const raw = typeof v.phone === "string" ? v.phone.trim() : "";
  if (raw === "") return; // le champ lui-même signale l'absence si elle est interdite
  const country = typeof v.phoneCountry === "string" ? v.phoneCountry : "";
  if (!normalizeWhatsApp(raw, country)) {
    ctx.addIssue({ code: "custom", path: ["phone"], message: PHONE_ERROR });
  }
}

const always = { when: () => true };

/* ------------------------------------------------------------------ */
/* Formulaire de capture (page /)                                      */
/* ------------------------------------------------------------------ */

const leadShape = {
  firstName,
  email: optionalEmail,
  phoneCountry,
  phone,
  challenge: z.enum(CHALLENGE_IDS, { error: "Choisis ta difficulté principale." }),
  consent: z.literal(true, {
    error: "Coche la case de consentement pour recevoir la démonstration.",
  }),
};

export const leadFormSchema = z
  .object(leadShape)
  .superRefine((v, ctx) => checkPhone(v, ctx), always);

export type LeadFormValues = z.input<typeof leadFormSchema>;

/* ------------------------------------------------------------------ */
/* Demande d'inscription (page /inscription)                           */
/* ------------------------------------------------------------------ */

const registrationShape = {
  fullName,
  email: optionalEmail,
  phoneCountry,
  phone,
  country: z
    .string({ error: "Choisis ton pays de résidence." })
    .trim()
    .refine(isKnownCountry, { error: "Choisis ton pays de résidence." }),
  paymentMethod: z.enum(PAYMENT_METHOD_IDS, { error: "Choisis un moyen de paiement." }),
  /** Session affichée au moment de la demande (vérifiée côté serveur). */
  cohort: z.enum(COHORT_IDS, { error: "Session inconnue : recharge la page." }),
  consentTerms: z.literal(true, { error: "Tu dois accepter les conditions de vente." }),
  consentEarlyStart: offer.legal.requireEarlyStartConsent
    ? z.literal(true, {
        error: "Cette confirmation est nécessaire pour démarrer la formation à la date prévue.",
      })
    : z.boolean(),
  consentDeposit: z.boolean().default(false),
  consentMarketing: z.boolean().default(false),
};

export const registrationFormSchema = z
  .object(registrationShape)
  .superRefine((v, ctx) => {
    checkPhone(v, ctx);
    // Session 2 : les conditions de la réservation de place doivent être acceptées.
    if (findCohort(v.cohort)?.deposit && v.consentDeposit !== true) {
      ctx.addIssue({
        code: "custom",
        path: ["consentDeposit"],
        message: "Coche cette case pour réserver ta place.",
      });
    }
  }, always);

export type RegistrationFormValues = z.input<typeof registrationFormSchema>;

/* ------------------------------------------------------------------ */
/* Désinscription                                                       */
/* ------------------------------------------------------------------ */

export const unsubscribeFormSchema = z
  .object({
    email: optionalEmail,
    phoneCountry,
    phone: z.string().trim().max(25, { error: "Numéro trop long." }),
  })
  .superRefine((v, ctx) => {
    if (v.phone === "" && v.email === "") {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Indique ton numéro WhatsApp ou ton adresse e-mail.",
      });
      return;
    }
    checkPhone(v, ctx);
  });

export type UnsubscribeFormValues = z.input<typeof unsubscribeFormSchema>;

/* ------------------------------------------------------------------ */
/* Métadonnées techniques envoyées avec chaque formulaire               */
/* ------------------------------------------------------------------ */

const shortText = z
  .string()
  .trim()
  .max(150)
  .nullish()
  .transform((v) => (v ? v : null));

export const attributionSchema = z
  .object({
    utmSource: shortText,
    utmMedium: shortText,
    utmCampaign: shortText,
    utmContent: shortText,
    utmTerm: shortText,
    referrerHost: z
      .string()
      .trim()
      .max(253)
      .regex(/^[a-z0-9.-]+$/i)
      .nullish()
      .catch(null)
      .transform((v) => (v ? v.toLowerCase() : null)),
    landingPath: z
      .string()
      .trim()
      .max(200)
      .regex(/^\/[^?#\s]*$/)
      .nullish()
      .catch(null)
      .transform((v) => (v ? v : null)),
  })
  .catch({
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    referrerHost: null,
    landingPath: null,
  });

export const submissionMetaSchema = z.object({
  /** Champ piège invisible : doit rester vide. */
  hp: z.string().max(500).optional().default(""),
  /** Durée (ms) entre l'affichage du formulaire et l'envoi, mesurée par le navigateur. */
  elapsedMs: z.number().nonnegative().max(1e10),
  attribution: attributionSchema.optional(),
});

export type SubmissionMeta = z.output<typeof submissionMetaSchema>;

export function normalizeAttribution(a: SubmissionMeta["attribution"]): Attribution {
  return {
    utmSource: a?.utmSource ?? null,
    utmMedium: a?.utmMedium ?? null,
    utmCampaign: a?.utmCampaign ?? null,
    utmContent: a?.utmContent ?? null,
    utmTerm: a?.utmTerm ?? null,
    referrerHost: a?.referrerHost ?? null,
    landingPath: a?.landingPath ?? null,
  };
}

/** Erreurs par champ, au format attendu par les formulaires. */
export type FieldErrors = Partial<Record<string, string>>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
