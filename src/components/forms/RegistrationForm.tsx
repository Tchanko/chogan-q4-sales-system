"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { consentTexts, offer } from "@/content/offer";
import { trackEvent } from "@/lib/analytics/track";
import type { CountryOption } from "@/lib/validation/phone";
import { registrationFormSchema, toFieldErrors, type FieldErrors } from "@/lib/validation/schemas";
import { CheckboxField, CountryOptions, FieldError, FormAlert, Honeypot, PhoneField, SelectField, TextField } from "./fields";
import { NETWORK_ERROR, focusFirstError, postJson, useSubmissionMeta } from "./submit";

interface Values {
  fullName: string;
  email: string;
  phoneCountry: string;
  phone: string;
  country: string;
  paymentMethod: string;
  cohort: string;
  consentTerms: boolean;
  consentEarlyStart: boolean;
  consentDeposit: boolean;
  consentMarketing: boolean;
}

/** Session ouverte au moment de l'affichage (revérifiée par le serveur). */
export interface FormCohort {
  id: string;
  name: string;
  startLabel: string;
  /** Session 2 : montant de la réservation et solde ; null sinon. */
  depositLabel: string | null;
  balanceLabel: string | null;
}

export function RegistrationForm({
  countries,
  cohort,
}: {
  countries: { priority: CountryOption[]; others: CountryOption[] };
  cohort: FormCohort;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({
    fullName: "",
    email: "",
    phoneCountry: "FR",
    phone: "",
    country: "",
    paymentMethod: "",
    cohort: cohort.id,
    consentTerms: false,
    consentEarlyStart: false,
    consentDeposit: false,
    consentMarketing: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [hp, setHp] = useState("");
  const [phoneCountryTouched, setPhoneCountryTouched] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const meta = useSubmissionMeta();

  const update = (patch: Partial<Values>) => {
    const next = { ...values, ...patch };
    setValues(next);
    if (attempted) {
      const r = registrationFormSchema.safeParse(next);
      setErrors(r.success ? {} : toFieldErrors(r.error));
    }
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setAttempted(true);
    setServerMessage(null);
    const parsed = registrationFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      focusFirstError(formRef.current);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const res = await postJson<{ registrationId: string; reference: string }>("/api/registrations", {
      ...values,
      ...meta(hp),
    });

    if (res.ok && res.data?.registrationId) {
      trackEvent(
        "registration_requested",
        {
          value: offer.price.amountCents / 100,
          currency: offer.price.currency,
          payment_method: values.paymentMethod,
          cohort: cohort.id,
        },
        { dedupeKey: res.data.registrationId, scope: "persistent" },
      );
      router.push("/confirmation");
      return;
    }
    setSubmitting(false);
    if (res.data?.fieldErrors) {
      setErrors(res.data.fieldErrors);
      focusFirstError(formRef.current);
    }
    setServerMessage(res.data?.message ?? NETWORK_ERROR);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative space-y-6">
      <Honeypot value={hp} onChange={setHp} />

      <TextField
        id="reg-fullName"
        label="Nom et prénom"
        autoComplete="name"
        value={values.fullName}
        onValueChange={(v) => update({ fullName: v })}
        error={errors.fullName}
        maxLength={100}
      />
      <PhoneField
        id="reg-phone"
        label="Numéro WhatsApp"
        country={values.phoneCountry}
        phone={values.phone}
        onCountryChange={(v) => {
          setPhoneCountryTouched(true);
          update({ phoneCountry: v });
        }}
        onPhoneChange={(v) => update({ phone: v })}
        countries={countries}
        error={errors.phone ?? errors.phoneCountry}
        hint="Les instructions de paiement et la confirmation te sont envoyées sur ce numéro."
      />
      <TextField
        id="reg-email"
        label="Adresse e-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        optional
        value={values.email}
        onValueChange={(v) => update({ email: v })}
        error={errors.email}
        maxLength={254}
      />
      <SelectField
        id="reg-country"
        label="Pays de résidence"
        autoComplete="country"
        value={values.country}
        onValueChange={(v) =>
          // L'indicatif suit le pays de résidence tant qu'il n'a pas été choisi à la main.
          update(phoneCountryTouched || values.phone ? { country: v } : { country: v, phoneCountry: v })
        }
        error={errors.country}
      >
        <option value="" disabled>
          Choisis ton pays
        </option>
        <CountryOptions countries={countries} />
      </SelectField>

      <fieldset
        aria-describedby={errors.paymentMethod ? "reg-payment-error" : undefined}
        data-invalid={errors.paymentMethod ? "true" : undefined}
      >
        <legend className="field-label">Moyen de paiement souhaité</legend>
        <p className="-mt-0.5 mb-3 text-sm text-muted">
          Aucun paiement n&apos;est demandé maintenant : les instructions
          {cohort.depositLabel ? ` (réservation de ${cohort.depositLabel})` : ""} te sont envoyées sur
          WhatsApp après validation de ta demande.
        </p>
        <div className="space-y-2">
          {offer.paymentMethods.map((m) => (
            <label
              key={m.id}
              className={`flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition-colors ${
                values.paymentMethod === m.id ? "border-ink bg-mist" : "border-line hover:border-muted"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={m.id}
                checked={values.paymentMethod === m.id}
                onChange={() => update({ paymentMethod: m.id })}
                className="mt-0.5 size-5 shrink-0 accent-ink"
              />
              <span>
                <span className="block font-semibold">{m.label}</span>
                <span className="block text-sm text-muted">{m.help}</span>
              </span>
            </label>
          ))}
        </div>
        <FieldError id="reg-payment" message={errors.paymentMethod} />
      </fieldset>

      <div className="space-y-4 rounded-2xl bg-mist p-5">
        <CheckboxField
          id="reg-terms"
          checked={values.consentTerms}
          onCheckedChange={(v) => update({ consentTerms: v })}
          error={errors.consentTerms}
          required
        >
          J&apos;ai lu et j&apos;accepte les{" "}
          <Link href="/conditions-de-vente" target="_blank" className="font-semibold underline underline-offset-2">
            conditions de vente
            <span className="sr-only"> (nouvel onglet)</span>
          </Link>{" "}
          et la{" "}
          <Link href="/confidentialite" target="_blank" className="font-semibold underline underline-offset-2">
            politique de confidentialité
            <span className="sr-only"> (nouvel onglet)</span>
          </Link>
          .
        </CheckboxField>
        {offer.legal.requireEarlyStartConsent && (
          <CheckboxField
            id="reg-earlyStart"
            checked={values.consentEarlyStart}
            onCheckedChange={(v) => update({ consentEarlyStart: v })}
            error={errors.consentEarlyStart}
            required
          >
            {consentTexts.earlyStart(cohort.startLabel)}
          </CheckboxField>
        )}
        {cohort.depositLabel && cohort.balanceLabel && (
          <CheckboxField
            id="reg-deposit"
            checked={values.consentDeposit}
            onCheckedChange={(v) => update({ consentDeposit: v })}
            error={errors.consentDeposit}
            required
          >
            {consentTexts.deposit(cohort.depositLabel, cohort.balanceLabel)}
          </CheckboxField>
        )}
        <CheckboxField
          id="reg-marketing"
          checked={values.consentMarketing}
          onCheckedChange={(v) => update({ consentMarketing: v })}
        >
          {consentTexts.marketing}
        </CheckboxField>
      </div>

      <FormAlert message={serverMessage} />

      <button type="submit" className="btn btn-primary w-full text-lg" disabled={submitting}>
        {submitting ? "Envoi en cours…" : `Envoyer ma demande d'inscription à la ${cohort.name}`}
      </button>
      <p className="text-center text-sm text-muted">
        Envoyer ta demande ne t&apos;engage à aucun paiement immédiat et ne réserve pas encore de place.
        {cohort.depositLabel
          ? " Ta place sera réservée après vérification du paiement de ta réservation."
          : " Ton inscription sera confirmée après vérification de ton paiement."}
      </p>
    </form>
  );
}
