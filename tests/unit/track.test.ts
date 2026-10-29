import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Stockage navigateur minimal pour l'environnement Node. */
function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, String(v)),
  };
}

let gtag: ReturnType<typeof vi.fn>;
let fbq: ReturnType<typeof vi.fn>;

function setConsent(analytics: boolean, marketing: boolean) {
  window.localStorage.setItem(
    "cq4_consent",
    JSON.stringify({ version: 1, analytics, marketing, decidedAt: new Date().toISOString() }),
  );
}

beforeEach(() => {
  vi.resetModules();
  gtag = vi.fn();
  fbq = vi.fn();
  vi.stubGlobal("window", {
    localStorage: fakeStorage(),
    sessionStorage: fakeStorage(),
    gtag,
    fbq,
    dispatchEvent: () => true,
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("suivi des conversions", () => {
  it("n'envoie rien sans consentement", async () => {
    const { trackEvent } = await import("@/lib/analytics/track");
    expect(trackEvent("lead_submitted", {}, { dedupeKey: "l1", scope: "persistent" })).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
    expect(fbq).not.toHaveBeenCalled();
  });

  it("respecte le détail du consentement (mesure sans publicité)", async () => {
    setConsent(true, false);
    const { trackEvent } = await import("@/lib/analytics/track");
    trackEvent("lead_submitted", { challenge: "ia" }, { dedupeKey: "l1", scope: "persistent" });
    expect(gtag).toHaveBeenCalledWith("event", "generate_lead", { challenge: "ia" });
    expect(fbq).not.toHaveBeenCalled();
  });

  it("ne déclenche jamais deux fois le même événement", async () => {
    setConsent(true, true);
    const { trackEvent } = await import("@/lib/analytics/track");
    expect(trackEvent("registration_requested", {}, { dedupeKey: "r1", scope: "persistent" })).toBe(true);
    expect(trackEvent("registration_requested", {}, { dedupeKey: "r1", scope: "persistent" })).toBe(false);
    expect(trackEvent("registration_requested", {}, { dedupeKey: "r2", scope: "persistent" })).toBe(true);
    expect(gtag).toHaveBeenCalledTimes(2);
    expect(fbq).toHaveBeenCalledWith("track", "SubmitApplication", {}, { eventID: "registration_requested:r1" });
  });

  it("le dédoublonnage persiste après rechargement du module (nouvelle page)", async () => {
    setConsent(true, false);
    const first = await import("@/lib/analytics/track");
    first.trackEvent("payment_confirmed", {}, { dedupeKey: "p1", scope: "persistent" });
    vi.resetModules();
    const second = await import("@/lib/analytics/track");
    expect(second.trackEvent("payment_confirmed", {}, { dedupeKey: "p1", scope: "persistent" })).toBe(false);
    expect(gtag).toHaveBeenCalledTimes(1);
  });
});
