import Link from "next/link";
import { Suspense } from "react";
import { paymentMethodLabel } from "@/content/offer";
import {
  LEAD_STATUS_LABELS,
  REGISTRATION_STATUSES,
  REGISTRATION_STATUS_LABELS,
  acquisitionSource,
  challengeLabel,
  type RegistrationStatus,
} from "@/lib/domain";
import { formatDeadline } from "@/lib/enrollment";
import { getEnrollmentStateNow } from "@/lib/enrollment-server";
import { computeFunnelStats } from "@/lib/services/stats";
import { requireAdmin } from "@/lib/session/admin";
import { getRepository } from "@/lib/storage";
import { countryName, formatPhone } from "@/lib/validation/phone";
import { LeadActions, LogoutButton, RegistrationActions } from "./AdminActions";

const LIST_LIMIT = 200;

export default function AdminPage() {
  return (
    <div className="container-page py-10">
      <Suspense fallback={<p className="text-muted">Chargement du tableau de bord…</p>}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

const pct = (value: number | null) =>
  value === null ? "—" : `${(value * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

const euros = (cents: number) => `${(cents / 100).toLocaleString("fr-FR")} €`;

const waLink = (e164: string) => `https://wa.me/${e164.replace(/\D/g, "")}`;

const STATUS_STYLE: Record<RegistrationStatus, string> = {
  request_received: "bg-mist text-ink",
  payment_pending: "bg-yellow text-ink",
  confirmed: "bg-cyan text-ink",
  cancelled: "bg-ink text-paper",
};

async function Dashboard() {
  await requireAdmin();
  const repo = getRepository();
  if (!repo) {
    return (
      <div role="alert" className="rounded-2xl bg-paper p-6">
        <h1 className="text-2xl font-bold">Stockage non configuré</h1>
        <p className="mt-2 text-muted">
          Renseigne SUPABASE_URL et SUPABASE_SECRET_KEY (voir le README) : aucune donnée ne peut être
          enregistrée tant que le stockage n&apos;est pas configuré.
        </p>
      </div>
    );
  }

  const [leads, registrations] = await Promise.all([repo.listLeads(5000), repo.listRegistrations(5000)]);
  const stats = computeFunnelStats(leads, registrations, new Date());
  const enrollment = getEnrollmentStateNow();

  const kpis = [
    { label: "Prospects collectés", value: String(stats.leads.total), hint: `+${stats.leads.last7Days} sur 7 jours` },
    {
      label: "Demandes d'inscription",
      value: String(stats.registrations.active),
      hint: `+${stats.registrations.last7Days} sur 7 jours (hors annulées)`,
    },
    {
      label: "Paiements confirmés",
      value: String(stats.confirmedPayments),
      hint: `${euros(stats.confirmedRevenueCents)} vérifiés`,
    },
    { label: "Prospect → demande", value: pct(stats.conversion.leadToRegistration), hint: "même numéro WhatsApp" },
    { label: "Demande → paiement", value: pct(stats.conversion.registrationToPayment), hint: "paiements vérifiés" },
    { label: "Désinscriptions", value: String(stats.leads.unsubscribed), hint: "prospects désinscrits" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted">
            Stockage :{" "}
            <strong>{repo.driver === "supabase" ? "Supabase" : "fichier local (tests uniquement)"}</strong> ·
            Inscriptions :{" "}
            <strong>
              {enrollment.open
                ? `ouvertes jusqu'au ${formatDeadline(enrollment.deadlineIso)}`
                : enrollment.reason === "manually_closed"
                  ? "fermées manuellement"
                  : "closes (date limite dépassée)"}
            </strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/admin/export?type=leads" className="btn btn-outline min-h-10 px-4 py-2 text-sm">
            Exporter les prospects (CSV)
          </a>
          <a href="/admin/export?type=registrations" className="btn btn-outline min-h-10 px-4 py-2 text-sm">
            Exporter les inscriptions (CSV)
          </a>
          <LogoutButton />
        </div>
      </div>

      {repo.driver !== "supabase" && (
        <p role="note" className="rounded-xl border-l-4 border-yellow bg-paper p-4 text-sm font-semibold">
          Stockage local actif : adapté aux tests, pas à la production. Configure Supabase avant la mise en
          ligne.
        </p>
      )}

      <section aria-labelledby="kpi-titre">
        <h2 id="kpi-titre" className="sr-only">
          Indicateurs clés
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-2xl bg-paper p-5">
              <dt className="text-sm font-semibold text-muted">{k.label}</dt>
              <dd className="mt-1 font-display text-3xl font-extrabold">{k.value}</dd>
              <dd className="text-xs text-muted">{k.hint}</dd>
            </div>
          ))}
        </dl>
        <ul className="mt-4 flex flex-wrap gap-2 text-sm">
          {REGISTRATION_STATUSES.map((s) => (
            <li key={s} className={`rounded-full px-3 py-1 font-semibold ${STATUS_STYLE[s]}`}>
              {REGISTRATION_STATUS_LABELS[s]} : {stats.registrations.byStatus[s]}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section aria-labelledby="sources-titre" className="min-w-0 rounded-2xl bg-paper p-5">
          <h2 id="sources-titre" className="text-lg font-bold">
            Sources d&apos;acquisition
          </h2>
          <div className="relative mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-semibold">Source</th>
                  <th scope="col" className="py-2 pr-3 text-right font-semibold">Prospects</th>
                  <th scope="col" className="py-2 pr-3 text-right font-semibold">Demandes</th>
                  <th scope="col" className="py-2 text-right font-semibold">Paiements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {stats.bySource.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-3 text-muted">Aucune donnée pour le moment.</td>
                  </tr>
                )}
                {stats.bySource.map((s) => (
                  <tr key={s.source}>
                    <th scope="row" className="py-2 pr-3 font-semibold">{s.source}</th>
                    <td className="py-2 pr-3 text-right">{s.leads}</td>
                    <td className="py-2 pr-3 text-right">{s.registrations}</td>
                    <td className="py-2 text-right">{s.confirmed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            Source = paramètre utm_source du lien, sinon site d&apos;origine, sinon « direct ».
          </p>
        </section>

        <section aria-labelledby="difficultes-titre" className="min-w-0 rounded-2xl bg-paper p-5">
          <h2 id="difficultes-titre" className="text-lg font-bold">
            Difficultés déclarées
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {stats.leads.byChallenge.map((c) => (
              <li key={c.id} className="flex items-center gap-3">
                <span className="flex-1">{c.label}</span>
                <span className="font-bold">{c.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="inscriptions-titre">
        <h2 id="inscriptions-titre" className="text-xl font-bold">
          Demandes d&apos;inscription <span className="text-muted">({registrations.length})</span>
        </h2>
        <div className="relative mt-3 overflow-x-auto rounded-2xl bg-paper">
          <table className="w-full min-w-[60rem] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th scope="col" className="p-3 font-semibold">Date</th>
                <th scope="col" className="p-3 font-semibold">Référence</th>
                <th scope="col" className="p-3 font-semibold">Participant</th>
                <th scope="col" className="p-3 font-semibold">Paiement</th>
                <th scope="col" className="p-3 font-semibold">Statut</th>
                <th scope="col" className="w-72 p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line align-top">
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-muted">Aucune demande pour le moment.</td>
                </tr>
              )}
              {registrations.slice(0, LIST_LIMIT).map((r) => (
                <tr key={r.id} data-testid={`registration-row-${r.reference}`}>
                  <td className="p-3 whitespace-nowrap">{dateFormat.format(new Date(r.createdAt))}</td>
                  <td className="p-3 font-mono font-bold">{r.reference}</td>
                  <td className="p-3">
                    <p className="font-semibold">{r.fullName}</p>
                    <a href={waLink(r.whatsapp)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                      {formatPhone(r.whatsapp)}
                    </a>
                    {r.email && <p className="text-muted">{r.email}</p>}
                    <p className="text-muted">
                      {countryName(r.country)} · source : {acquisitionSource(r.attribution)}
                    </p>
                  </td>
                  <td className="p-3">
                    <p>{paymentMethodLabel(r.paymentMethod)}</p>
                    <p className="text-muted">{euros(r.priceCents)}</p>
                    {r.paymentReference && (
                      <p className="text-xs text-muted">
                        Réf. : {r.paymentReference}
                        {r.paymentVerificationSource === "manual" ? " (vérif. manuelle)" : " (prestataire)"}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[r.status]}`}>
                      {REGISTRATION_STATUS_LABELS[r.status]}
                    </span>
                    {r.consentMarketing && <p className="mt-1 text-xs text-muted">Accepte les offres</p>}
                  </td>
                  <td className="p-3">
                    <RegistrationActions id={r.id} reference={r.reference} status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="prospects-titre">
        <h2 id="prospects-titre" className="text-xl font-bold">
          Prospects <span className="text-muted">({leads.length})</span>
        </h2>
        <div className="relative mt-3 overflow-x-auto rounded-2xl bg-paper">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th scope="col" className="p-3 font-semibold">Date</th>
                <th scope="col" className="p-3 font-semibold">Prénom</th>
                <th scope="col" className="p-3 font-semibold">Contact</th>
                <th scope="col" className="p-3 font-semibold">Difficulté</th>
                <th scope="col" className="p-3 font-semibold">Source</th>
                <th scope="col" className="p-3 font-semibold">Statut</th>
                <th scope="col" className="p-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line align-top">
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-muted">Aucun prospect pour le moment.</td>
                </tr>
              )}
              {leads.slice(0, LIST_LIMIT).map((l) => (
                <tr key={l.id}>
                  <td className="p-3 whitespace-nowrap">{dateFormat.format(new Date(l.createdAt))}</td>
                  <td className="p-3 font-semibold">
                    {l.firstName}
                    {l.submissions > 1 && <span className="ml-1 text-xs text-muted">({l.submissions} demandes)</span>}
                  </td>
                  <td className="p-3">
                    {l.status === "unsubscribed" ? (
                      <span className="text-muted">{formatPhone(l.whatsapp)} — ne plus contacter</span>
                    ) : (
                      <a href={waLink(l.whatsapp)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                        {formatPhone(l.whatsapp)}
                      </a>
                    )}
                    {l.email && <p className="text-muted">{l.email}</p>}
                  </td>
                  <td className="p-3">{challengeLabel(l.challenge)}</td>
                  <td className="p-3">
                    {acquisitionSource(l.attribution)}
                    {l.attribution.utmCampaign && <p className="text-xs text-muted">{l.attribution.utmCampaign}</p>}
                  </td>
                  <td className="p-3">{LEAD_STATUS_LABELS[l.status]}</td>
                  <td className="p-3">
                    <LeadActions id={l.id} status={l.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leads.length > LIST_LIMIT && (
          <p className="mt-2 text-sm text-muted">
            Seuls les {LIST_LIMIT} plus récents sont affichés : utilise l&apos;export CSV pour la liste complète.
          </p>
        )}
      </section>

      <p className="text-xs text-muted">
        Données personnelles : accès réservé. Ne copie pas ces informations hors des outils prévus et
        respecte les désinscriptions. <Link href="/confidentialite" className="underline">Politique de confidentialité</Link>
      </p>
    </div>
  );
}
