"use client";

import type { ChangeEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import type { CountryOption } from "@/lib/validation/phone";

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="field-error">
      {message}
    </p>
  );
}

function Label({ htmlFor, label, optional }: { htmlFor: string; label: string; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="field-label">
      {label}
      {optional && <span className="font-normal text-muted"> (facultatif)</span>}
    </label>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
};

export function TextField({ id, label, value, onValueChange, error, hint, optional, ...rest }: TextFieldProps) {
  return (
    <div>
      <Label htmlFor={id} label={label} optional={optional} />
      {hint && (
        <p id={`${id}-hint`} className="-mt-0.5 mb-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      <input
        id={id}
        className="field-input"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={optional ? undefined : true}
        {...rest}
      />
      <FieldError id={id} message={error} />
    </div>
  );
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> & {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  children: ReactNode;
};

export function SelectField({ id, label, value, onValueChange, error, children, ...rest }: SelectFieldProps) {
  return (
    <div>
      <Label htmlFor={id} label={label} />
      <select
        id={id}
        className="field-input appearance-auto"
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onValueChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error)}
        aria-required
        {...rest}
      >
        {children}
      </select>
      <FieldError id={id} message={error} />
    </div>
  );
}

export function CountryOptions({
  countries,
  withDialCode,
}: {
  countries: { priority: CountryOption[]; others: CountryOption[] };
  withDialCode?: boolean;
}) {
  const label = (c: CountryOption) => (withDialCode ? `${c.name} (${c.dialCode})` : c.name);
  return (
    <>
      <optgroup label="Pays les plus fréquents">
        {countries.priority.map((c) => (
          <option key={c.code} value={c.code}>
            {label(c)}
          </option>
        ))}
      </optgroup>
      <optgroup label="Tous les pays">
        {countries.others.map((c) => (
          <option key={c.code} value={c.code}>
            {label(c)}
          </option>
        ))}
      </optgroup>
    </>
  );
}

export function PhoneField(props: {
  id: string;
  label: string;
  country: string;
  phone: string;
  onCountryChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  countries: { priority: CountryOption[]; others: CountryOption[] };
  error?: string;
  optional?: boolean;
  hint?: string;
}) {
  const { id } = props;
  const hint = props.hint ?? "Choisis l'indicatif, puis saisis ton numéro (ou directement au format +33…).";
  return (
    <fieldset>
      <legend className="field-label">
        {props.label}
        {props.optional && <span className="font-normal text-muted"> (facultatif)</span>}
      </legend>
      <p id={`${id}-hint`} className="-mt-0.5 mb-1.5 text-sm text-muted">
        {hint}
      </p>
      <div className="grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)] gap-2">
        <div>
          <label htmlFor={`${id}-country`} className="sr-only">
            Indicatif du pays
          </label>
          <select
            id={`${id}-country`}
            className="field-input appearance-auto px-2 text-sm"
            value={props.country}
            onChange={(e) => props.onCountryChange(e.target.value)}
            autoComplete="tel-country-code"
          >
            <CountryOptions countries={props.countries} withDialCode />
          </select>
        </div>
        <div>
          <label htmlFor={id} className="sr-only">
            Numéro de téléphone
          </label>
          <input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="field-input"
            value={props.phone}
            onChange={(e) => props.onPhoneChange(e.target.value)}
            aria-invalid={props.error ? true : undefined}
            aria-describedby={describedBy(id, props.error, hint)}
            aria-required={props.optional ? undefined : true}
            placeholder="06 12 34 56 78"
            maxLength={25}
          />
        </div>
      </div>
      <FieldError id={id} message={props.error} />
    </fieldset>
  );
}

export function CheckboxField(props: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: ReactNode;
  error?: string;
  required?: boolean;
  tone?: "light" | "dark";
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={props.id}
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-ink"
          checked={props.checked}
          onChange={(e) => props.onCheckedChange(e.target.checked)}
          aria-invalid={props.error ? true : undefined}
          aria-describedby={props.error ? `${props.id}-error` : undefined}
          aria-required={props.required ? true : undefined}
        />
        <label htmlFor={props.id} className="cursor-pointer text-sm leading-relaxed">
          {props.children}
        </label>
      </div>
      <FieldError id={props.id} message={props.error} />
    </div>
  );
}

/** Champ piège invisible : un humain ne le voit pas et ne le remplit pas. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
      <label htmlFor="cq4-hp-field">Ne pas remplir ce champ</label>
      <input
        id="cq4-hp-field"
        name="cq4_hp"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function FormAlert({ message, tone = "error" }: { message: string | null; tone?: "error" | "info" }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} aria-live="polite">
      {message && (
        <p
          className={
            tone === "error"
              ? "rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-semibold text-danger"
              : "rounded-xl border border-line bg-mist px-4 py-3 text-sm"
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
