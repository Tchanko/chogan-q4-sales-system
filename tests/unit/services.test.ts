import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/services/csv";
import { submitLead } from "@/lib/services/leads";
import { applyProviderPayment } from "@/lib/services/payments";
import {
  changeRegistrationStatus,
  confirmManualPayment,
  looksLikeBankData,
  submitRegistration,
} from "@/lib/services/registrations";
import { computeFunnelStats } from "@/lib/services/stats";
import { submitUnsubscribe } from "@/lib/services/unsubscribe";
import { humanMeta, memoryRepo, openEnrollment, validLead, validRegistration } from "./helpers";

const registrationDeps = (repo = memoryRepo()) => ({
  repo,
  enrollment: openEnrollment,
  canIssueConfirmationCookie: true,
});

describe("prospects", () => {
  it("enregistre un prospect valide au format E.164", async () => {
    const repo = memoryRepo();
    const result = await submitLead(validLead, repo);
    expect(result.ok).toBe(true);
    const [lead] = await repo.listLeads(10);
    expect(lead).toMatchObject({
      firstName: "Awa",
      email: null,
      whatsapp: "+2250707123456",
      challenge: "ia",
      status: "new",
      consentVersion: "lead-2026-10-v1",
    });
    expect(lead.attribution.utmSource).toBe("facebook");
  });

  it("ne crée pas de doublon pour le même numéro WhatsApp", async () => {
    const repo = memoryRepo();
    const first = await submitLead(validLead, repo);
    const second = await submitLead({ ...validLead, firstName: "Awa B", email: "awa@ex.com" }, repo);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.value.leadId).toBe(first.value.leadId);
    expect(second.value.isNew).toBe(false);
    const leads = await repo.listLeads(10);
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ firstName: "Awa B", email: "awa@ex.com", submissions: 2 });
  });

  it("refuse sans rien enregistrer si le stockage n'est pas configuré", async () => {
    const result = await submitLead(validLead, null);
    expect(result).toEqual({ ok: false, code: "STORAGE_UNAVAILABLE" });
  });

  it("rejette les robots (champ piège ou envoi instantané)", async () => {
    const repo = memoryRepo();
    expect(await submitLead({ ...validLead, hp: "x" }, repo)).toMatchObject({ code: "BOT_SUSPECTED" });
    expect(await submitLead({ ...validLead, elapsedMs: 100 }, repo)).toMatchObject({
      code: "BOT_SUSPECTED",
    });
    expect(await submitLead({ ...validLead, elapsedMs: undefined }, repo)).toMatchObject({
      code: "BOT_SUSPECTED",
    });
    expect(await repo.listLeads(10)).toHaveLength(0);
  });

  it("renvoie les erreurs de champ sans enregistrer", async () => {
    const repo = memoryRepo();
    const result = await submitLead({ ...validLead, consent: false, phone: "1" }, repo);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("VALIDATION");
    expect(Object.keys(result.fieldErrors ?? {})).toEqual(expect.arrayContaining(["consent", "phone"]));
    expect(await repo.listLeads(10)).toHaveLength(0);
  });
});

describe("demandes d'inscription", () => {
  it("enregistre une demande au statut « demande reçue », jamais « confirmée »", async () => {
    const deps = registrationDeps();
    const result = await submitRegistration(validRegistration, deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.reference).toMatch(/^CQ4-[A-Z0-9]{6}$/);
    const saved = await deps.repo.getRegistration(result.value.registrationId);
    expect(saved).toMatchObject({
      status: "request_received",
      priceCents: 29700,
      currency: "EUR",
      whatsapp: "+33612345678",
      paymentVerifiedAt: null,
      paymentVerificationSource: null,
    });
  });

  it("refuse quand les inscriptions sont closes", async () => {
    const deps = { ...registrationDeps(), enrollment: { ...openEnrollment, open: false, reason: "deadline_passed" as const } };
    expect(await submitRegistration(validRegistration, deps)).toEqual({
      ok: false,
      code: "ENROLLMENT_CLOSED",
    });
    expect(await deps.repo.listRegistrations(10)).toHaveLength(0);
  });

  it("refuse si le stockage ou le secret ne sont pas configurés", async () => {
    expect(
      await submitRegistration(validRegistration, { ...registrationDeps(), repo: null }),
    ).toMatchObject({ code: "STORAGE_UNAVAILABLE" });
    const deps = { ...registrationDeps(), canIssueConfirmationCookie: false };
    expect(await submitRegistration(validRegistration, deps)).toMatchObject({
      code: "CONFIG_INCOMPLETE",
    });
    expect(await deps.repo.listRegistrations(10)).toHaveLength(0);
  });

  it("régénère la référence en cas de collision", async () => {
    const repo = memoryRepo();
    const refs = ["CQ4-AAAAAA", "CQ4-AAAAAA", "CQ4-BBBBBB"];
    const makeReference = () => refs.shift()!;
    const deps = { ...registrationDeps(repo), makeReference };
    const a = await submitRegistration(validRegistration, deps);
    const b = await submitRegistration(validRegistration, deps);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) expect([a.value.reference, b.value.reference]).toEqual(["CQ4-AAAAAA", "CQ4-BBBBBB"]);
  });
});

describe("statuts et vérification des paiements", () => {
  async function newRegistration() {
    const deps = registrationDeps();
    const result = await submitRegistration(validRegistration, deps);
    if (!result.ok) throw new Error("setup");
    return { repo: deps.repo, id: result.value.registrationId, reference: result.value.reference };
  }

  it("interdit de confirmer via un simple changement de statut", async () => {
    const { repo, id } = await newRegistration();
    expect(await changeRegistrationStatus(repo, id, "confirmed")).toMatchObject({
      code: "INVALID_TRANSITION",
    });
  });

  it("passe en attente de paiement puis confirme après vérification manuelle", async () => {
    const { repo, id } = await newRegistration();
    expect((await changeRegistrationStatus(repo, id, "payment_pending")).ok).toBe(true);
    const confirmed = await confirmManualPayment(repo, id, {
      paymentReference: "MM-20261024-7781",
      verified: true,
    });
    expect(confirmed.ok).toBe(true);
    expect(await repo.getRegistration(id)).toMatchObject({
      status: "confirmed",
      paymentVerificationSource: "manual",
      paymentReference: "MM-20261024-7781",
    });
  });

  it("exige la case de vérification et une référence, et refuse les données bancaires", async () => {
    const { repo, id } = await newRegistration();
    const missing = await confirmManualPayment(repo, id, { paymentReference: "", verified: false });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(Object.keys(missing.fieldErrors ?? {})).toEqual(["verified", "paymentReference"]);
    const card = await confirmManualPayment(repo, id, {
      paymentReference: "4111 1111 1111 1111",
      verified: true,
    });
    expect(card.ok).toBe(false);
    expect((await repo.getRegistration(id))?.status).toBe("request_received");
  });

  it("distingue numéros de carte / IBAN et références de transaction", () => {
    expect(looksLikeBankData("4111111111111111")).toBe(true);
    expect(looksLikeBankData("FR76 3000 6000 0112 3456 7890 189")).toBe(true);
    expect(looksLikeBankData("MP231024.1530.A12345")).toBe(false);
    expect(looksLikeBankData("Virement reçu le 24/10, réf. 88412")).toBe(false);
  });

  it("annuler une inscription confirmée efface la trace de vérification", async () => {
    const { repo, id } = await newRegistration();
    await confirmManualPayment(repo, id, { paymentReference: "REF-1", verified: true });
    expect((await changeRegistrationStatus(repo, id, "cancelled")).ok).toBe(true);
    expect(await repo.getRegistration(id)).toMatchObject({
      status: "cancelled",
      paymentVerifiedAt: null,
      paymentVerificationSource: null,
    });
  });

  it("applique un paiement prestataire vérifié une seule fois", async () => {
    const { repo, id, reference } = await newRegistration();
    const event = {
      type: "payment.succeeded" as const,
      provider: "test",
      registrationReference: reference,
      providerTransactionId: "tx_123",
      amountCents: 29700,
      currency: "EUR",
    };
    const first = await applyProviderPayment(repo, event);
    const replay = await applyProviderPayment(repo, event);
    expect(first).toEqual({ ok: true, value: { registrationId: id, newlyConfirmed: true } });
    expect(replay).toEqual({ ok: true, value: { registrationId: id, newlyConfirmed: false } });
    expect(await repo.getRegistration(id)).toMatchObject({
      status: "confirmed",
      paymentVerificationSource: "provider",
      paymentProvider: "test",
    });
  });

  it("refuse un paiement prestataire au mauvais montant", async () => {
    const { repo, id, reference } = await newRegistration();
    const result = await applyProviderPayment(repo, {
      type: "payment.succeeded",
      provider: "test",
      registrationReference: reference,
      providerTransactionId: "tx_9",
      amountCents: 100,
      currency: "EUR",
    });
    expect(result.ok).toBe(false);
    expect((await repo.getRegistration(id))?.status).toBe("request_received");
  });
});

describe("désinscription", () => {
  it("désinscrit le prospect et retire le consentement marketing de l'inscrit", async () => {
    const repo = memoryRepo();
    await submitLead({ ...validLead, phoneCountry: "FR", phone: "0612345678" }, repo);
    await submitRegistration(
      { ...validRegistration, consentMarketing: true },
      { repo, enrollment: openEnrollment, canIssueConfirmationCookie: true },
    );
    const result = await submitUnsubscribe(
      { phone: "06 12 34 56 78", phoneCountry: "FR", email: "", ...humanMeta },
      repo,
    );
    expect(result.ok).toBe(true);
    expect((await repo.listLeads(1))[0].status).toBe("unsubscribed");
    expect((await repo.listRegistrations(1))[0].consentMarketing).toBe(false);
  });

  it("répond de la même façon pour un contact inconnu", async () => {
    const repo = memoryRepo();
    const result = await submitUnsubscribe(
      { phone: "", phoneCountry: "FR", email: "inconnu@example.com", ...humanMeta },
      repo,
    );
    expect(result).toEqual({ ok: true, value: null });
  });
});

describe("statistiques du tunnel", () => {
  it("calcule les taux de conversion et les sources", async () => {
    const repo = memoryRepo();
    const deps = { repo, enrollment: openEnrollment, canIssueConfirmationCookie: true };
    await submitLead({ ...validLead, phoneCountry: "FR", phone: "0612345678" }, repo);
    await submitLead({ ...validLead, phone: "0707000001", attribution: { utmSource: "tiktok" } }, repo);
    const reg = await submitRegistration(validRegistration, deps);
    if (!reg.ok) throw new Error("setup");
    await confirmManualPayment(repo, reg.value.registrationId, { paymentReference: "R-1", verified: true });

    const stats = computeFunnelStats(await repo.listLeads(100), await repo.listRegistrations(100));
    expect(stats.leads.total).toBe(2);
    expect(stats.registrations.active).toBe(1);
    expect(stats.confirmedPayments).toBe(1);
    expect(stats.confirmedRevenueCents).toBe(29700);
    expect(stats.conversion.leadToRegistration).toBe(0.5);
    expect(stats.conversion.registrationToPayment).toBe(1);
    expect(stats.bySource).toEqual(
      expect.arrayContaining([
        { source: "facebook", leads: 1, registrations: 0, confirmed: 0 },
        { source: "tiktok", leads: 1, registrations: 0, confirmed: 0 },
        { source: "instagram", leads: 0, registrations: 1, confirmed: 1 },
      ]),
    );
  });

  it("renvoie null plutôt qu'un taux trompeur quand il n'y a pas de données", () => {
    const stats = computeFunnelStats([], []);
    expect(stats.conversion).toEqual({
      leadToRegistration: null,
      registrationToPayment: null,
      leadToPayment: null,
    });
  });
});

describe("export CSV", () => {
  it("neutralise les formules et échappe les séparateurs", () => {
    const csv = toCsv(
      [{ a: "=HYPERLINK(\"x\")", b: "Dupont; Jean" }],
      [
        { header: "A", value: (r) => r.a },
        { header: "B", value: (r) => r.b },
      ],
    );
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain(`"Dupont; Jean"`);
  });
});
