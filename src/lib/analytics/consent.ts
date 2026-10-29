/**
 * Choix de consentement aux traceurs non essentiels (navigateur uniquement).
 * Conservé 6 mois, puis redemandé.
 */

export interface ConsentChoice {
  version: 1;
  /** Mesure d'audience (Google Analytics 4). */
  analytics: boolean;
  /** Publicité (pixels Meta et TikTok). */
  marketing: boolean;
  decidedAt: string;
}

const STORAGE_KEY = "cq4_consent";
const MAX_AGE_MS = 182 * 24 * 3600 * 1000;
export const CONSENT_EVENT = "cq4:consent-changed";
export const OPEN_PREFERENCES_EVENT = "cq4:open-consent";

export function readConsent(now: number = Date.now()): ConsentChoice | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentChoice>;
    if (parsed.version !== 1 || typeof parsed.decidedAt !== "string") return null;
    if (now - new Date(parsed.decidedAt).getTime() > MAX_AGE_MS) return null;
    return {
      version: 1,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      decidedAt: parsed.decidedAt,
    };
  } catch {
    return null;
  }
}

export function saveConsent(choice: { analytics: boolean; marketing: boolean }): ConsentChoice {
  const value: ConsentChoice = { version: 1, ...choice, decidedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* stockage indisponible : le choix vaut pour la page en cours */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  return value;
}

/** Supprime les cookies Google Analytics après un retrait du consentement. */
export function clearAnalyticsCookies(): void {
  const host = window.location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (!name || !/^(_ga|_gid|_gat|_fbp|_fbc|_ttp)/.test(name)) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

export function openConsentPreferences(): void {
  window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT));
}
