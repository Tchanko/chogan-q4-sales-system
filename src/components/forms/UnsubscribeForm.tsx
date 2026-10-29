"use client";

import { useRef, useState, type FormEvent } from "react";
import type { CountryOption } from "@/lib/validation/phone";
import { toFieldErrors, unsubscribeFormSchema, type FieldErrors } from "@/lib/validation/schemas";
import { FormAlert, Honeypot, PhoneField, TextField } from "./fields";
import { NETWORK_ERROR, focusFirstError, postJson, useSubmissionMeta } from "./submit";

export function UnsubscribeForm({ countries }: { countries: { priority: CountryOption[]; others: CountryOption[] } }) {
  const [values, setValues] = useState({ phoneCountry: "FR", phone: "", email: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [hp, setHp] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const meta = useSubmissionMeta();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setServerMessage(null);
    const parsed = unsubscribeFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      focusFirstError(formRef.current);
      return;
    }
    setErrors({});
    setStatus("submitting");
    const res = await postJson("/api/unsubscribe", { ...values, ...meta(hp) });
    if (res.ok) {
      setStatus("done");
      return;
    }
    setStatus("idle");
    if (res.data?.fieldErrors) setErrors(res.data.fieldErrors);
    setServerMessage(res.data?.message ?? NETWORK_ERROR);
  }

  if (status === "done") {
    return (
      <div role="status" className="rounded-2xl bg-mist p-6" data-testid="unsubscribe-done">
        <p className="text-lg font-bold">Ta demande de désinscription est enregistrée.</p>
        <p className="mt-2 text-muted">
          Tu ne recevras plus de messages marketing de notre part à ces coordonnées. Pense à répondre
          « STOP » dans la conversation WhatsApp si elle est déjà ouverte.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative space-y-5">
      <Honeypot value={hp} onChange={setHp} />
      <PhoneField
        id="unsub-phone"
        label="Numéro WhatsApp"
        optional
        country={values.phoneCountry}
        phone={values.phone}
        onCountryChange={(v) => setValues({ ...values, phoneCountry: v })}
        onPhoneChange={(v) => setValues({ ...values, phone: v })}
        countries={countries}
        error={errors.phone}
        hint="Le numéro utilisé dans ta demande."
      />
      <TextField
        id="unsub-email"
        label="Adresse e-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        optional
        value={values.email}
        onValueChange={(v) => setValues({ ...values, email: v })}
        error={errors.email}
      />
      <FormAlert message={serverMessage} />
      <button type="submit" className="btn btn-dark w-full" disabled={status === "submitting"}>
        {status === "submitting" ? "Envoi en cours…" : "Me désinscrire"}
      </button>
    </form>
  );
}
