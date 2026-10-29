/**
 * Tests des routes d'API, appelées comme le ferait Next.js.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimits } from "@/lib/security/rate-limit";
import { resetRepositoryCache } from "@/lib/storage";
import { validLead, validRegistration } from "./helpers";

const ORIGIN = "http://localhost:3000";

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}${path}`, {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: ORIGIN,
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.7",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  resetRateLimits();
  resetRepositoryCache();
  vi.stubEnv("STORAGE_DRIVER", "memory");
  vi.stubEnv("APP_SECRET", "s".repeat(48));
  vi.stubEnv("ENROLLMENT_OPEN", "true");
  vi.stubEnv("ENROLLMENT_DEADLINE", "2099-01-01T00:00:00Z");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/leads", () => {
  it("enregistre et renvoie 201", async () => {
    const { POST } = await import("@/app/api/leads/route");
    const res = await POST(post("/api/leads", validLead));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.leadId).toBeTruthy();
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("répond 503 sans confirmation quand le stockage n'est pas configuré", async () => {
    vi.stubEnv("STORAGE_DRIVER", "");
    vi.stubEnv("SUPABASE_URL", "");
    resetRepositoryCache();
    const { POST } = await import("@/app/api/leads/route");
    const res = await POST(post("/api/leads", validLead));
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.message).toMatch(/n'a pas été enregistrée/);
  });

  it("refuse une requête provenant d'un autre site", async () => {
    const { POST } = await import("@/app/api/leads/route");
    const res = await POST(post("/api/leads", validLead, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
  });

  it("renvoie 422 avec les erreurs de champ", async () => {
    const { POST } = await import("@/app/api/leads/route");
    const res = await POST(post("/api/leads", { ...validLead, firstName: "" }));
    expect(res.status).toBe(422);
    expect((await res.json()).fieldErrors.firstName).toBeTruthy();
  });

  it("limite le nombre d'envois par adresse IP", async () => {
    const { POST } = await import("@/app/api/leads/route");
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await POST(post("/api/leads", { ...validLead, phone: `0707000${100 + i}` }));
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
    expect(statuses[5]).toBe(429);
  });

  it("sans adresse IP transmise, ne bloque pas les visiteurs après 5 envois", async () => {
    const { POST } = await import("@/app/api/leads/route");
    for (let i = 0; i < 8; i++) {
      const req = post("/api/leads", { ...validLead, phone: `0707000${200 + i}` }, { "x-forwarded-for": "" });
      expect((await POST(req)).status).toBe(201);
    }
  });
});

describe("POST /api/registrations", () => {
  it("enregistre la demande et pose un cookie signé HttpOnly limité à /confirmation", async () => {
    const { POST } = await import("@/app/api/registrations/route");
    const res = await POST(post("/api/registrations", validRegistration));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.reference).toMatch(/^CQ4-/);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/^cq4_reg=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\/confirmation/);
    expect(cookie).toMatch(/SameSite=lax/i);
  });

  it("refuse quand les inscriptions sont fermées manuellement", async () => {
    vi.stubEnv("ENROLLMENT_OPEN", "false");
    const { POST } = await import("@/app/api/registrations/route");
    const res = await POST(post("/api/registrations", validRegistration));
    expect(res.status).toBe(409);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("refuse quand la date limite est dépassée", async () => {
    vi.stubEnv("ENROLLMENT_DEADLINE", "2020-01-01T00:00:00Z");
    const { POST } = await import("@/app/api/registrations/route");
    const res = await POST(post("/api/registrations", validRegistration));
    expect(res.status).toBe(409);
  });

  it("refuse sans APP_SECRET (configuration incomplète) sans rien enregistrer", async () => {
    vi.stubEnv("APP_SECRET", "");
    const { POST } = await import("@/app/api/registrations/route");
    const res = await POST(post("/api/registrations", validRegistration));
    expect(res.status).toBe(503);
  });
});

describe("POST /api/webhooks/payment", () => {
  it("répond 501 tant qu'aucun prestataire n'est branché", async () => {
    const { POST } = await import("@/app/api/webhooks/payment/route");
    const res = await POST(post("/api/webhooks/payment", { type: "payment.succeeded" }));
    expect(res.status).toBe(501);
  });
});
