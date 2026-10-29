import {
  getCountries,
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";

/** Pays proposés en tête de liste (audience principale). */
const PRIORITY_COUNTRIES: CountryCode[] = [
  "FR",
  "BE",
  "CH",
  "LU",
  "IT",
  "ES",
  "CA",
  "CI",
  "SN",
  "CM",
  "BJ",
  "TG",
  "MA",
];

export const DEFAULT_COUNTRY: CountryCode = "FR";

export interface CountryOption {
  code: CountryCode;
  name: string;
  dialCode: string;
}

let cachedOptions: { priority: CountryOption[]; others: CountryOption[] } | null = null;

/** Liste complète des pays (noms en français), pays prioritaires en tête. */
export function countryOptions(): { priority: CountryOption[]; others: CountryOption[] } {
  if (cachedOptions) return cachedOptions;
  const names = new Intl.DisplayNames(["fr"], { type: "region" });
  const toOption = (code: CountryCode): CountryOption => ({
    code,
    name: names.of(code) ?? code,
    dialCode: `+${getCountryCallingCode(code)}`,
  });
  const collator = new Intl.Collator("fr");
  const priority = PRIORITY_COUNTRIES.map(toOption);
  const others = getCountries()
    .filter((c) => !PRIORITY_COUNTRIES.includes(c))
    .map(toOption)
    .sort((a, b) => collator.compare(a.name, b.name));
  cachedOptions = { priority, others };
  return cachedOptions;
}

export function isKnownCountry(code: string): code is CountryCode {
  return isSupportedCountry(code);
}

export function countryName(code: string): string {
  if (!isKnownCountry(code)) return code;
  return new Intl.DisplayNames(["fr"], { type: "region" }).of(code) ?? code;
}

/**
 * Normalise un numéro WhatsApp au format international E.164 (+33612345678).
 * Le numéro peut être saisi au format national (avec l'indicatif choisi)
 * ou international (+… ou 00…). Renvoie null si le numéro est invalide.
 */
export function normalizeWhatsApp(raw: string, country: string): string | null {
  const input = raw.trim().replace(/^00/, "+");
  if (input.length < 6 || input.length > 25) return null;
  if (!/^[+\d\s().-]+$/.test(input)) return null;
  const region = isKnownCountry(country) ? country : DEFAULT_COUNTRY;
  const parsed = parsePhoneNumberFromString(input, region);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

/** Affichage lisible d'un numéro E.164 (format international). */
export function formatPhone(e164: string): string {
  const parsed = parsePhoneNumberFromString(e164);
  return parsed ? parsed.formatInternational() : e164;
}
