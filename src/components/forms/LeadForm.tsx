"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { WhatsAppLink } from "@/components/ui/WhatsAppLink";
import { consentTexts, offer } from "@/content/offer";
import { trackEvent } from "@/lib/analytics/track";
import { CHALLENGES } from "@/lib/domain";
import { whatsappMessages, whatsappUrl } from "@/lib/site";
import type { CountryOption } from "@/lib/validation/phone";
import { leadFormSchema, toFieldErrors, type FieldErrors } from "@/lib/validation/schemas";
import { CheckboxField, FormAlert, Honeypot, PhoneField, SelectField, TextField } from "./fields";
import { NETWORK_ERROR, focusFirstError, postJson, useSubmissionMeta } from "./submit";

interface Values {
  firstName: string;
  email: string;
  phoneCountry: string;
  phone: string;
  challenge: string;
  consent: boolean;
}

const initialValues: Values = {
  firstName: "",
  email: "",
  phoneCountry: "FR",
  phone: "",
  challenge: "",
  consent: false,
};

export function LeadForm({ countries }: { countries: { priority: CountryOption[]; others: CountryOption[] } }) {
  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [hp, setHp] = useState("");
  const [savedName, setSavedName] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const meta = useSubmissionMeta();

  const update = <K extends keyof Values>(key: K, value: Values[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (attempted) {
      const r = leadFormSchema.safeParse(next);
      setErrors(r.success ? {} : toFieldErrors(r.error));
    }
  };

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setAttempted(true);
    setServerMessage(null);
    const parsed = leadFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      focusFirstError(formRef.current);
      return;
    }
    setErrors({});
    setStatus("submitting");
    const res = await postJson<{ leadId: string }>("/api/leads", { ...values, ...meta(hp) });

    if (res.ok && res.data?.leadId) {
      trackEvent(
        "lead_submitted",
        { challenge: values.challenge },
        { dedupeKey: res.data.leadId, scope: "persistent" },
      );
      setSavedName(parsed.data.firstName);
      setStatus("success");
      return;
    }
    setStatus("idle");
    if (res.data?.fieldErrors) {
      setErrors(res.data.fieldErrors);
      focusFirstError(formRef.current);
    }
    setServerMessage(res.data?.message ?? NETWORK_ERROR);
  }

  if (status === "success") {
    const waUrl = whatsappUrl(whatsappMessages.leadMagnet);
    return (
      <div className="space-y-5" data-testid="lead-success">
        <h2 ref={successRef} tabIndex={-1} className="text-2xl font-bold outline-none">
          C&apos;est noté, {savedName} !
        </h2>
        <p className="leading-relaxed text-ink/80">
          Ta place pour la masterclass de lancement du {offer.leadMagnet.masterclass.dateLabel} est bien
          enregistrée. Le lien d&apos;accès t&apos;est transmis sur WhatsApp
          {waUrl
            ? " : écris-nous pour le recevoir et poser tes questions."
            : ", au numéro que tu as indiqué."}
        </p>
        {waUrl && (
          <WhatsAppLink href={waUrl} location="lead_success" className="btn btn-primary w-full">
            Continuer sur WhatsApp
          </WhatsAppLink>
        )}
        <Link href="/formation" className="btn btn-outline w-full">
          Découvrir la formation complète
        </Link>
        <p className="text-xs text-muted">
          Tu peux te désinscrire à tout moment depuis la page{" "}
          <Link href="/desinscription" className="underline underline-offset-2">
            désinscription
          </Link>{" "}
          ou en répondant « STOP » sur WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative space-y-5" aria-describedby="lead-form-note">
      <Honeypot value={hp} onChange={setHp} />
      <TextField
        id="lead-firstName"
        label="Prénom"
        autoComplete="given-name"
        value={values.firstName}
        onValueChange={(v) => update("firstName", v)}
        error={errors.firstName}
        maxLength={50}
      />
      <PhoneField
        id="lead-phone"
        label="Numéro WhatsApp"
        country={values.phoneCountry}
        phone={values.phone}
        onCountryChange={(v) => update("phoneCountry", v)}
        onPhoneChange={(v) => update("phone", v)}
        countries={countries}
        error={errors.phone ?? errors.phoneCountry}
      />
      <TextField
        id="lead-email"
        label="Adresse e-mail"
        type="email"
        autoComplete="email"
        inputMode="email"
        optional
        value={values.email}
        onValueChange={(v) => update("email", v)}
        error={errors.email}
        maxLength={254}
      />
      <SelectField
        id="lead-challenge"
        label="Ta difficulté principale"
        value={values.challenge}
        onValueChange={(v) => update("challenge", v)}
        error={errors.challenge}
      >
        <option value="" disabled>
          Choisis une réponse
        </option>
        {CHALLENGES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </SelectField>
      <CheckboxField
        id="lead-consent"
        checked={values.consent}
        onCheckedChange={(v) => update("consent", v)}
        error={errors.consent}
        required
      >
        {consentTexts.lead}
      </CheckboxField>
      <p id="lead-form-note" className="text-xs leading-relaxed text-muted">
        Tes données servent uniquement à t&apos;envoyer la démonstration et à te parler de cette
        formation. Elles ne sont ni vendues ni cédées.{" "}
        <Link href="/confidentialite" className="underline underline-offset-2">
          Politique de confidentialité
        </Link>
      </p>
      <FormAlert message={serverMessage} />
      <button type="submit" className="btn btn-primary w-full text-base sm:text-lg" disabled={status === "submitting"}>
        {status === "submitting" ? "Envoi en cours…" : offer.leadMagnet.masterclass.ctaLabel}
      </button>
    </form>
  );
}
