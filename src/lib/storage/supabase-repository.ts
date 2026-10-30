/**
 * Pilote Supabase (production).
 *
 * Utilise la clé secrète (service_role) : ce module ne doit être importé
 * que côté serveur. Les tables ont la RLS activée sans aucune politique
 * publique — voir supabase/migrations.
 */
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  CohortFullError,
  DuplicateReferenceError,
  type LeadRecord,
  type NewLead,
  type NewRegistration,
  type OptOutContact,
  type RegistrationPatch,
  type RegistrationPublicView,
  type RegistrationRecord,
  type Repository,
} from "./types";
import type {
  ChallengeId,
  LeadStatus,
  PaymentVerificationSource,
  RegistrationStatus,
} from "@/lib/domain";

type Row = Record<string, unknown>;

const str = (v: unknown): string => String(v ?? "");
const strOrNull = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
const numOrNull = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

function attributionFromRow(row: Row) {
  return {
    utmSource: strOrNull(row.utm_source),
    utmMedium: strOrNull(row.utm_medium),
    utmCampaign: strOrNull(row.utm_campaign),
    utmContent: strOrNull(row.utm_content),
    utmTerm: strOrNull(row.utm_term),
    referrerHost: strOrNull(row.referrer_host),
    landingPath: strOrNull(row.landing_path),
  };
}

function attributionToRow(a: NewLead["attribution"]) {
  return {
    utm_source: a.utmSource,
    utm_medium: a.utmMedium,
    utm_campaign: a.utmCampaign,
    utm_content: a.utmContent,
    utm_term: a.utmTerm,
    referrer_host: a.referrerHost,
    landing_path: a.landingPath,
  };
}

function leadFromRow(row: Row): LeadRecord {
  return {
    id: str(row.id),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    firstName: str(row.first_name),
    email: strOrNull(row.email),
    whatsapp: str(row.whatsapp),
    challenge: str(row.challenge) as ChallengeId,
    status: str(row.status) as LeadStatus,
    submissions: Number(row.submissions ?? 1),
    consentVersion: str(row.consent_version),
    consentAt: str(row.consent_at),
    optedOutAt: strOrNull(row.opted_out_at),
    attribution: attributionFromRow(row),
  };
}

function registrationFromRow(row: Row): RegistrationRecord {
  return {
    id: str(row.id),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    reference: str(row.reference),
    cohort: str(row.cohort),
    fullName: str(row.full_name),
    whatsapp: str(row.whatsapp),
    email: strOrNull(row.email),
    country: str(row.country),
    paymentMethod: str(row.payment_method),
    priceCents: Number(row.price_cents),
    depositCents: numOrNull(row.deposit_cents),
    currency: str(row.currency),
    termsVersion: str(row.terms_version),
    consentEarlyStart: Boolean(row.consent_early_start),
    consentDeposit: Boolean(row.consent_deposit),
    consentMarketing: Boolean(row.consent_marketing),
    status: str(row.status) as RegistrationStatus,
    paymentVerifiedAt: strOrNull(row.payment_verified_at),
    paymentVerificationSource: strOrNull(
      row.payment_verification_source,
    ) as PaymentVerificationSource | null,
    paymentProvider: strOrNull(row.payment_provider),
    paymentReference: strOrNull(row.payment_reference),
    balanceVerifiedAt: strOrNull(row.balance_verified_at),
    balanceReference: strOrNull(row.balance_reference),
    adminNote: strOrNull(row.admin_note),
    attribution: attributionFromRow(row),
  };
}

/** Erreur neutre : le détail technique reste dans les journaux serveur. */
function fail(operation: string, error: { message?: string; code?: string } | null): never {
  console.error(`[supabase] ${operation} a échoué`, { code: error?.code, message: error?.message });
  throw new Error(`storage_error:${operation}`);
}

export class SupabaseRepository implements Repository {
  readonly driver = "supabase" as const;
  private readonly client: SupabaseClient;

  constructor(url: string, secretKey: string) {
    this.client = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { "x-application-name": "chogan-q4-sales-system" } },
    });
  }

  async upsertLead(lead: NewLead): Promise<{ id: string; isNew: boolean }> {
    const a = lead.attribution;
    const { data, error } = await this.client.rpc("upsert_lead", {
      p_first_name: lead.firstName,
      p_email: lead.email,
      p_whatsapp: lead.whatsapp,
      p_challenge: lead.challenge,
      p_consent_version: lead.consentVersion,
      p_utm_source: a.utmSource,
      p_utm_medium: a.utmMedium,
      p_utm_campaign: a.utmCampaign,
      p_utm_content: a.utmContent,
      p_utm_term: a.utmTerm,
      p_referrer_host: a.referrerHost,
      p_landing_path: a.landingPath,
    });
    if (error) fail("upsert_lead", error);
    const row = (Array.isArray(data) ? data[0] : data) as Row | undefined;
    if (!row?.id) fail("upsert_lead", { message: "réponse vide" });
    return { id: str(row.id), isNew: Boolean(row.is_new) };
  }

  async createRegistration(r: NewRegistration): Promise<{ id: string }> {
    const { data, error } = await this.client
      .from("registrations")
      .insert({
        reference: r.reference,
        cohort: r.cohort,
        full_name: r.fullName,
        whatsapp: r.whatsapp,
        email: r.email,
        country: r.country,
        payment_method: r.paymentMethod,
        price_cents: r.priceCents,
        deposit_cents: r.depositCents,
        currency: r.currency,
        terms_version: r.termsVersion,
        consent_early_start: r.consentEarlyStart,
        consent_deposit: r.consentDeposit,
        consent_marketing: r.consentMarketing,
        ...attributionToRow(r.attribution),
      })
      .select("id")
      .single();
    if (error) {
      // 23505 = violation de contrainte d'unicité (référence déjà utilisée).
      if (error.code === "23505") throw new DuplicateReferenceError();
      fail("create_registration", error);
    }
    return { id: str((data as Row).id) };
  }

  async findRegistrationPublic(id: string): Promise<RegistrationPublicView | null> {
    const { data, error } = await this.client
      .from("registrations")
      .select(
        "id, reference, status, cohort, payment_method, price_cents, deposit_cents, currency, created_at, payment_verification_source, balance_verified_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) fail("find_registration_public", error);
    if (!data) return null;
    const row = data as Row;
    return {
      id: str(row.id),
      reference: str(row.reference),
      status: str(row.status) as RegistrationStatus,
      cohort: str(row.cohort),
      paymentMethod: str(row.payment_method),
      priceCents: Number(row.price_cents),
      depositCents: numOrNull(row.deposit_cents),
      currency: str(row.currency),
      createdAt: str(row.created_at),
      paymentVerificationSource: strOrNull(
        row.payment_verification_source,
      ) as PaymentVerificationSource | null,
      balanceVerifiedAt: strOrNull(row.balance_verified_at),
    };
  }

  async getRegistration(id: string): Promise<RegistrationRecord | null> {
    const { data, error } = await this.client
      .from("registrations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) fail("get_registration", error);
    return data ? registrationFromRow(data as Row) : null;
  }

  async getRegistrationByReference(reference: string): Promise<RegistrationRecord | null> {
    const { data, error } = await this.client
      .from("registrations")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();
    if (error) fail("get_registration_by_reference", error);
    return data ? registrationFromRow(data as Row) : null;
  }

  async updateRegistration(id: string, patch: RegistrationPatch): Promise<void> {
    const row: Row = { status: patch.status };
    if (patch.paymentVerifiedAt !== undefined) row.payment_verified_at = patch.paymentVerifiedAt;
    if (patch.paymentVerificationSource !== undefined)
      row.payment_verification_source = patch.paymentVerificationSource;
    if (patch.paymentProvider !== undefined) row.payment_provider = patch.paymentProvider;
    if (patch.paymentReference !== undefined) row.payment_reference = patch.paymentReference;
    if (patch.balanceVerifiedAt !== undefined) row.balance_verified_at = patch.balanceVerifiedAt;
    if (patch.balanceReference !== undefined) row.balance_reference = patch.balanceReference;
    if (patch.adminNote !== undefined) row.admin_note = patch.adminNote;
    const { error } = await this.client.from("registrations").update(row).eq("id", id);
    if (error) {
      // Levée par le déclencheur enforce_cohort_capacity (voir supabase/migrations).
      if (error.message?.includes("cohort_full")) throw new CohortFullError();
      fail("update_registration", error);
    }
  }

  async countConfirmedByCohort(): Promise<Record<string, number>> {
    const { data, error } = await this.client
      .from("registrations")
      .select("cohort")
      .eq("status", "confirmed");
    if (error) fail("count_confirmed_by_cohort", error);
    const counts: Record<string, number> = {};
    for (const row of data as Row[]) {
      const cohort = str(row.cohort);
      counts[cohort] = (counts[cohort] ?? 0) + 1;
    }
    return counts;
  }

  async recordOptOut(contact: OptOutContact): Promise<void> {
    const { error } = await this.client.rpc("record_opt_out", {
      p_whatsapp: contact.whatsapp,
      p_email: contact.email,
    });
    if (error) fail("record_opt_out", error);
  }

  async updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
    const { error } = await this.client.from("leads").update({ status }).eq("id", id);
    if (error) fail("update_lead_status", error);
  }

  async listLeads(limit: number): Promise<LeadRecord[]> {
    const { data, error } = await this.client
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) fail("list_leads", error);
    return (data as Row[]).map(leadFromRow);
  }

  async listRegistrations(limit: number): Promise<RegistrationRecord[]> {
    const { data, error } = await this.client
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) fail("list_registrations", error);
    return (data as Row[]).map(registrationFromRow);
  }

  /** Limitation de débit partagée (fonction SQL hit_rate_limit). */
  async hitRateLimit(key: string, windowSeconds: number, max: number): Promise<boolean> {
    const { data, error } = await this.client.rpc("hit_rate_limit", {
      p_key: key,
      p_window_seconds: windowSeconds,
      p_max: max,
    });
    if (error) fail("hit_rate_limit", error);
    return data === true;
  }
}
