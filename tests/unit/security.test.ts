import { beforeEach, describe, expect, it } from "vitest";
import { checkHumanSignals } from "@/lib/security/anti-bot";
import { checkRateLimit, hitMemoryLimit, resetRateLimits } from "@/lib/security/rate-limit";
import { isSameOrigin, readJsonBody } from "@/lib/security/request";
import { createSignedToken, safeEqual, verifySignedToken } from "@/lib/security/signing";

const SECRET = "x".repeat(40);

describe("jetons signés", () => {
  it("vérifie un jeton valide", () => {
    const token = createSignedToken("registration", { rid: "abc" }, 60, SECRET);
    expect(verifySignedToken("registration", token, SECRET)?.rid).toBe("abc");
  });

  it("refuse un jeton modifié", () => {
    const token = createSignedToken("registration", { rid: "abc" }, 60, SECRET);
    const [body, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ rid: "autre", exp: Date.now() + 1e6 })).toString("base64url");
    expect(verifySignedToken("registration", `${forged}.${sig}`, SECRET)).toBeNull();
    expect(verifySignedToken("registration", `${body}.${sig}x`, SECRET)).toBeNull();
  });

  it("refuse un jeton expiré", () => {
    const past = new Date(Date.now() - 3600_000);
    const token = createSignedToken("admin", {}, 60, SECRET, past);
    expect(verifySignedToken("admin", token, SECRET)).toBeNull();
  });

  it("refuse un jeton d'un autre usage ou d'un autre secret", () => {
    const token = createSignedToken("registration", { rid: "abc" }, 60, SECRET);
    expect(verifySignedToken("admin", token, SECRET)).toBeNull();
    expect(verifySignedToken("registration", token, "y".repeat(40))).toBeNull();
  });

  it("compare les mots de passe en temps constant", () => {
    expect(safeEqual("secret-123", "secret-123", SECRET)).toBe(true);
    expect(safeEqual("secret-123", "secret-124", SECRET)).toBe(false);
    expect(safeEqual("court", "beaucoup-plus-long", SECRET)).toBe(false);
  });
});

describe("signaux anti-robots", () => {
  it("détecte le champ piège rempli", () => {
    expect(checkHumanSignals({ hp: "http://spam", elapsedMs: 9000 })).toBe("honeypot");
  });
  it("détecte un envoi trop rapide", () => {
    expect(checkHumanSignals({ hp: "", elapsedMs: 300 })).toBe("too_fast");
  });
  it("laisse passer un envoi humain", () => {
    expect(checkHumanSignals({ hp: "", elapsedMs: 9000 })).toBe("ok");
  });
});

describe("limitation de débit", () => {
  beforeEach(() => resetRateLimits());
  const rule = { name: "test", max: 3, windowSeconds: 60 };

  it("bloque au-delà du maximum puis rouvre à la fenêtre suivante", () => {
    const t = 1_000_000_020_000;
    expect(hitMemoryLimit(rule, "ip", t).allowed).toBe(true);
    expect(hitMemoryLimit(rule, "ip", t).allowed).toBe(true);
    expect(hitMemoryLimit(rule, "ip", t).allowed).toBe(true);
    const blocked = hitMemoryLimit(rule, "ip", t);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(hitMemoryLimit(rule, "autre-ip", t).allowed).toBe(true);
    expect(hitMemoryLimit(rule, "ip", t + 61_000).allowed).toBe(true);
  });

  it("consulte le compteur partagé et garde la limite mémoire si la base échoue", async () => {
    const denying = { hitRateLimit: async () => false };
    expect((await checkRateLimit(rule, "k1", denying)).allowed).toBe(false);
    const failing = {
      hitRateLimit: async (): Promise<boolean> => {
        throw new Error("db down");
      },
    };
    expect((await checkRateLimit(rule, "k2", failing)).allowed).toBe(true);
  });
});

describe("contrôle d'origine", () => {
  const req = (headers: Record<string, string>) =>
    new Request("http://localhost:3000/api/leads", { method: "POST", headers });

  it("accepte une requête du même site", () => {
    expect(isSameOrigin(req({ host: "localhost:3000", origin: "http://localhost:3000" }))).toBe(true);
  });
  it("refuse une requête d'un autre site", () => {
    expect(isSameOrigin(req({ host: "localhost:3000", origin: "https://evil.example" }))).toBe(false);
  });
  it("refuse une requête sans en-tête Origin", () => {
    expect(isSameOrigin(req({ host: "localhost:3000" }))).toBe(false);
  });
});

describe("lecture du corps JSON", () => {
  const post = (body: string, type = "application/json") =>
    new Request("http://localhost/api", { method: "POST", headers: { "content-type": type }, body });

  it("refuse un autre type de contenu", async () => {
    expect(await readJsonBody(post("a=1", "application/x-www-form-urlencoded"))).toEqual({
      ok: false,
      reason: "type",
    });
  });
  it("refuse un corps trop volumineux", async () => {
    expect((await readJsonBody(post(JSON.stringify({ a: "x".repeat(20_000) })))).ok).toBe(false);
  });
  it("refuse un JSON invalide", async () => {
    expect(await readJsonBody(post("{oops"))).toEqual({ ok: false, reason: "json" });
  });
});
