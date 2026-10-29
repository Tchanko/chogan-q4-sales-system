/**
 * Chargement des outils de mesure, APRÈS consentement uniquement.
 * Les extraits reprennent les codes d'installation officiels de Google,
 * Meta et TikTok, réécrits en TypeScript sans script en ligne.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyFn = (...args: any[]) => void;

function injectScript(src: string): void {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

export function installGoogleAnalytics(measurementId: string): void {
  const w = window as any;
  if (w.__cq4Ga4) return;
  w.__cq4Ga4 = true;
  w.dataLayer = w.dataLayer || [];
  // gtag doit pousser l'objet « arguments » (comportement attendu par gtag.js).
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", measurementId);
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`);
}

export function installMetaPixel(pixelId: string): void {
  const w = window as any;
  if (w.fbq) return;
  const fbq: any = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  };
  w.fbq = fbq;
  if (!w._fbq) w._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  injectScript("https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", pixelId);
  fbq("track", "PageView");
}

export function installTikTokPixel(pixelId: string): void {
  const w = window as any;
  if (w.ttq && w.ttq._cq4) return;
  w.TiktokAnalyticsObject = "ttq";
  const ttq: any = (w.ttq = w.ttq || []);
  ttq._cq4 = true;
  ttq.methods = [
    "page", "track", "identify", "instances", "debug", "on", "off", "once", "ready",
    "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent",
  ];
  ttq.setAndDefer = (target: any, method: string) => {
    target[method] = (...args: unknown[]) => {
      target.push([method, ...args]);
    };
  };
  for (const method of ttq.methods) ttq.setAndDefer(ttq, method);
  ttq.instance = (id: string) => {
    const instance = ttq._i[id] || [];
    for (const method of ttq.methods) ttq.setAndDefer(instance, method);
    return instance;
  };
  ttq.load = (id: string, options?: Record<string, unknown>) => {
    const base = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = ttq._i || {};
    ttq._i[id] = [];
    ttq._i[id]._u = base;
    ttq._t = ttq._t || {};
    ttq._t[id] = +new Date();
    ttq._o = ttq._o || {};
    ttq._o[id] = options || {};
    injectScript(`${base}?sdkid=${encodeURIComponent(id)}&lib=ttq`);
  };
  ttq.load(pixelId);
  ttq.page();
}

/** Page vue lors d'une navigation interne (Meta et TikTok). */
export function trackClientPageView(): void {
  const w = window as any;
  if (typeof w.fbq === "function") (w.fbq as AnyFn)("track", "PageView");
  if (w.ttq && typeof w.ttq.page === "function") w.ttq.page();
}
