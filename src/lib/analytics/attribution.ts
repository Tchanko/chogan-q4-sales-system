/**
 * Attribution du premier contact de la session (paramètres UTM, site
 * référent). Conservée en sessionStorage, effacée à la fermeture de l'onglet,
 * et transmise uniquement si le visiteur envoie un formulaire.
 */
import { EMPTY_ATTRIBUTION, type Attribution } from "@/lib/domain";

const KEY = "cq4_attribution";

function clip(value: string | null, max = 150): string | null {
  const v = value?.trim();
  return v ? v.slice(0, max) : null;
}

export function captureAttribution(): void {
  try {
    if (window.sessionStorage.getItem(KEY)) return;
    const params = new URLSearchParams(window.location.search);
    let referrerHost: string | null = null;
    if (document.referrer) {
      const host = new URL(document.referrer).hostname.toLowerCase();
      if (host && host !== window.location.hostname) referrerHost = host;
    }
    const attribution: Attribution = {
      utmSource: clip(params.get("utm_source")),
      utmMedium: clip(params.get("utm_medium")),
      utmCampaign: clip(params.get("utm_campaign")),
      utmContent: clip(params.get("utm_content")),
      utmTerm: clip(params.get("utm_term")),
      referrerHost,
      landingPath: clip(window.location.pathname, 200),
    };
    window.sessionStorage.setItem(KEY, JSON.stringify(attribution));
  } catch {
    /* stockage indisponible : pas d'attribution */
  }
}

export function getAttribution(): Attribution {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) return { ...EMPTY_ATTRIBUTION, ...(JSON.parse(raw) as Partial<Attribution>) };
  } catch {
    /* ignoré */
  }
  return EMPTY_ATTRIBUTION;
}
