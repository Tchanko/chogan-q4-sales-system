/**
 * Exécute les migrations Supabase dans un PostgreSQL embarqué (PGlite) et
 * vérifie les garde-fous : accès public refusé, dédoublonnage, impossibilité
 * de confirmer sans vérification, 10 places par session, limitation de débit.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

const migrations = ["20261023000000_init.sql", "20261030000000_sessions.sql"].map((file) =>
  readFileSync(path.resolve(__dirname, "../../supabase/migrations", file), "utf8"),
);

let db: PGlite;

const upsert = (firstName: string, phone = "+2250707123456") =>
  db.query<{ id: string; is_new: boolean }>(
    `select * from public.upsert_lead($1, null, $2, 'ia', 'v1', 'facebook', null, null, null, null, null, '/')`,
    [firstName, phone],
  );

beforeAll(async () => {
  db = new PGlite();
  // Rôles fournis par Supabase.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
  `);
  for (const migration of migrations) await db.exec(migration);
  await db.exec(`grant usage on schema public to anon, authenticated, service_role;`);
});

describe("migration Supabase", () => {
  it("dédoublonne les prospects par numéro WhatsApp", async () => {
    const a = await upsert("Awa");
    const b = await upsert("Awa B");
    expect(a.rows[0].is_new).toBe(true);
    expect(b.rows[0]).toEqual({ id: a.rows[0].id, is_new: false });
    const rows = await db.query<{ first_name: string; submissions: number }>(
      "select first_name, submissions from public.leads",
    );
    expect(rows.rows).toEqual([{ first_name: "Awa B", submissions: 2 }]);
  });

  it("refuse tout accès aux rôles publics (anon, authenticated)", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await expect(db.query("select * from public.leads")).rejects.toThrow(/permission denied/);
      await expect(db.query("select * from public.registrations")).rejects.toThrow(/permission denied/);
      await expect(db.query("select * from public.funnel_by_source")).rejects.toThrow(/permission denied/);
      await expect(upsert("Intrus", "+33600000000")).rejects.toThrow(/permission denied/);
      await db.exec("reset role");
    }
  });

  it("autorise le rôle serveur (service_role)", async () => {
    await db.exec("set role service_role");
    const r = await db.query("select count(*)::int as n from public.leads");
    expect(r.rows[0]).toEqual({ n: 1 });
    await db.exec("reset role");
  });

  it("interdit une inscription confirmée sans vérification de paiement", async () => {
    await expect(
      db.query(`insert into public.registrations
        (reference, cohort, full_name, whatsapp, country, payment_method, price_cents, currency,
         terms_version, consent_early_start, status)
        values ('CQ4-ABC234', '2026-11', 'Awa Test', '+2250707123456', 'CI', 'virement', 29700, 'EUR', 't', true, 'confirmed')`),
    ).rejects.toThrow(/registrations_confirmed_requires_verification/);
  });

  const insertRegistration = (i: number, cohort: string, extra = "") =>
    db.query(`insert into public.registrations
      (reference, cohort, full_name, whatsapp, country, payment_method, price_cents, currency,
       terms_version, consent_early_start ${extra ? ", deposit_cents, consent_deposit" : ""})
      values ('CQ4-T${String(i).padStart(5, "0")}', '${cohort}', 'Participant Test', '+33600000${String(i).padStart(3, "0")}',
              'FR', 'virement', 29700, 'EUR', 't', true ${extra})
      returning id`);

  const confirm = (id: string) =>
    db.query(
      `update public.registrations
          set status = 'confirmed', payment_verified_at = now(), payment_verification_source = 'manual'
        where id = $1`,
      [id],
    );

  it("refuse une 11e inscription confirmée dans une même session", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 11; i++) {
      const r = await insertRegistration(i, "2026-11");
      ids.push((r.rows[0] as { id: string }).id);
    }
    for (const id of ids.slice(0, 10)) await confirm(id);
    await expect(confirm(ids[10])).rejects.toThrow(/cohort_full/);
    // Les autres sessions ne sont pas concernées.
    const other = await insertRegistration(50, "2026-12", ", 5000, true");
    await confirm((other.rows[0] as { id: string }).id);
    // Une annulation libère une place.
    await db.query("update public.registrations set status = 'cancelled' where id = $1", [ids[0]]);
    await confirm(ids[10]);
    const r = await db.query<{ n: number }>(
      "select count(*)::int as n from public.registrations where cohort = '2026-11' and status = 'confirmed'",
    );
    expect(r.rows[0].n).toBe(10);
  });

  it("encadre la réservation de place et la vérification du solde", async () => {
    await expect(insertRegistration(60, "2026-12", ", 5000, false")).rejects.toThrow(
      /registrations_deposit_requires_consent/,
    );
    await expect(insertRegistration(61, "2026-12", ", 29700, true")).rejects.toThrow(/registrations_deposit_amount/);
    const noDeposit = await insertRegistration(62, "2026-12");
    await expect(
      db.query("update public.registrations set balance_verified_at = now() where id = $1", [
        (noDeposit.rows[0] as { id: string }).id,
      ]),
    ).rejects.toThrow(/registrations_balance_requires_deposit/);
  });

  it("applique les désinscriptions aux prospects", async () => {
    await db.query("select public.record_opt_out($1, null)", ["+2250707123456"]);
    const r = await db.query<{ status: string }>("select status from public.leads");
    expect(r.rows[0].status).toBe("unsubscribed");
  });

  it("limite le débit par fenêtre", async () => {
    const r = await db.query<{ a: boolean; b: boolean; c: boolean }>(
      "select public.hit_rate_limit('k', 60, 2) a, public.hit_rate_limit('k', 60, 2) b, public.hit_rate_limit('k', 60, 2) c",
    );
    expect(r.rows[0]).toEqual({ a: true, b: true, c: false });
  });
});
