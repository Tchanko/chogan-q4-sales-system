import { CHALLENGES, REGISTRATION_STATUSES, acquisitionSource, type RegistrationStatus } from "@/lib/domain";
import type { LeadRecord, RegistrationRecord } from "@/lib/storage/types";

export interface SourceRow {
  source: string;
  leads: number;
  registrations: number;
  confirmed: number;
}

export interface FunnelStats {
  leads: {
    total: number;
    unsubscribed: number;
    last7Days: number;
    byChallenge: { id: string; label: string; count: number }[];
  };
  registrations: {
    /** Demandes actives (hors annulées). */
    active: number;
    last7Days: number;
    byStatus: Record<RegistrationStatus, number>;
  };
  confirmedPayments: number;
  /** Chiffre d'affaires vérifié, en centimes. */
  confirmedRevenueCents: number;
  conversion: {
    /** Part des prospects ayant envoyé une demande d'inscription. */
    leadToRegistration: number | null;
    /** Part des demandes dont le paiement a été vérifié. */
    registrationToPayment: number | null;
    leadToPayment: number | null;
  };
  bySource: SourceRow[];
}

const ratio = (num: number, den: number): number | null => (den > 0 ? num / den : null);

export function computeFunnelStats(
  leads: LeadRecord[],
  registrations: RegistrationRecord[],
  now: Date = new Date(),
): FunnelStats {
  const weekAgo = now.getTime() - 7 * 24 * 3600 * 1000;
  const recent = (iso: string) => new Date(iso).getTime() >= weekAgo;

  const byStatus = Object.fromEntries(REGISTRATION_STATUSES.map((s) => [s, 0])) as Record<
    RegistrationStatus,
    number
  >;
  for (const r of registrations) byStatus[r.status] += 1;

  const active = registrations.filter((r) => r.status !== "cancelled");
  const confirmed = registrations.filter((r) => r.status === "confirmed");

  // Prospects ayant ensuite demandé leur inscription (même numéro WhatsApp).
  const registeredNumbers = new Set(active.map((r) => r.whatsapp));
  const confirmedNumbers = new Set(confirmed.map((r) => r.whatsapp));
  const leadsWhoRegistered = leads.filter((l) => registeredNumbers.has(l.whatsapp)).length;
  const leadsWhoPaid = leads.filter((l) => confirmedNumbers.has(l.whatsapp)).length;

  const sources = new Map<string, SourceRow>();
  const row = (source: string) => {
    let r = sources.get(source);
    if (!r) {
      r = { source, leads: 0, registrations: 0, confirmed: 0 };
      sources.set(source, r);
    }
    return r;
  };
  for (const l of leads) row(acquisitionSource(l.attribution)).leads += 1;
  for (const r of active) {
    const s = row(acquisitionSource(r.attribution));
    s.registrations += 1;
    if (r.status === "confirmed") s.confirmed += 1;
  }

  return {
    leads: {
      total: leads.length,
      unsubscribed: leads.filter((l) => l.status === "unsubscribed").length,
      last7Days: leads.filter((l) => recent(l.createdAt)).length,
      byChallenge: CHALLENGES.map((c) => ({
        id: c.id,
        label: c.label,
        count: leads.filter((l) => l.challenge === c.id).length,
      })).sort((a, b) => b.count - a.count),
    },
    registrations: {
      active: active.length,
      last7Days: active.filter((r) => recent(r.createdAt)).length,
      byStatus,
    },
    confirmedPayments: confirmed.length,
    confirmedRevenueCents: confirmed.reduce((sum, r) => sum + r.priceCents, 0),
    conversion: {
      leadToRegistration: ratio(leadsWhoRegistered, leads.length),
      registrationToPayment: ratio(confirmed.length, active.length),
      leadToPayment: ratio(leadsWhoPaid, leads.length),
    },
    bySource: [...sources.values()].sort(
      (a, b) => b.leads + b.registrations - (a.leads + a.registrations),
    ),
  };
}
