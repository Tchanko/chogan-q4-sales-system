import { paymentMethodLabel } from "@/content/offer";
import { LEAD_STATUS_LABELS, REGISTRATION_STATUS_LABELS, acquisitionSource, challengeLabel } from "@/lib/domain";
import { jsonError } from "@/lib/http/api";
import { toCsv } from "@/lib/services/csv";
import { isAdminAuthenticated } from "@/lib/session/admin";
import { getRepository } from "@/lib/storage";
import type { LeadRecord, RegistrationRecord } from "@/lib/storage/types";

/** Export CSV réservé à l'administration (?type=leads|registrations). */
export async function GET(request: Request): Promise<Response> {
  if (!(await isAdminAuthenticated())) return jsonError(401, "UNAUTHORIZED", "Connexion requise.");
  const repo = getRepository();
  if (!repo) return jsonError(503, "STORAGE_UNAVAILABLE", "Stockage non configuré.");

  const type = new URL(request.url).searchParams.get("type");
  const day = new Date().toISOString().slice(0, 10);
  let csv: string;
  let filename: string;

  if (type === "leads") {
    const leads = await repo.listLeads(100_000);
    csv = toCsv<LeadRecord>(leads, [
      { header: "Date", value: (l) => l.createdAt },
      { header: "Prénom", value: (l) => l.firstName },
      { header: "WhatsApp", value: (l) => l.whatsapp },
      { header: "E-mail", value: (l) => l.email },
      { header: "Difficulté", value: (l) => challengeLabel(l.challenge) },
      { header: "Statut", value: (l) => LEAD_STATUS_LABELS[l.status] },
      { header: "Demandes", value: (l) => l.submissions },
      { header: "Consentement (version)", value: (l) => l.consentVersion },
      { header: "Consentement (date)", value: (l) => l.consentAt },
      { header: "Source", value: (l) => acquisitionSource(l.attribution) },
      { header: "utm_medium", value: (l) => l.attribution.utmMedium },
      { header: "utm_campaign", value: (l) => l.attribution.utmCampaign },
      { header: "utm_content", value: (l) => l.attribution.utmContent },
      { header: "Page d'arrivée", value: (l) => l.attribution.landingPath },
    ]);
    filename = `prospects-${day}.csv`;
  } else if (type === "registrations") {
    const registrations = await repo.listRegistrations(100_000);
    csv = toCsv<RegistrationRecord>(registrations, [
      { header: "Date", value: (r) => r.createdAt },
      { header: "Référence", value: (r) => r.reference },
      { header: "Nom", value: (r) => r.fullName },
      { header: "WhatsApp", value: (r) => r.whatsapp },
      { header: "E-mail", value: (r) => r.email },
      { header: "Pays", value: (r) => r.country },
      { header: "Moyen de paiement", value: (r) => paymentMethodLabel(r.paymentMethod) },
      { header: "Montant (€)", value: (r) => (r.priceCents / 100).toFixed(2).replace(".", ",") },
      { header: "Statut", value: (r) => REGISTRATION_STATUS_LABELS[r.status] },
      { header: "Paiement vérifié le", value: (r) => r.paymentVerifiedAt },
      { header: "Vérification", value: (r) => r.paymentVerificationSource },
      { header: "Référence de paiement", value: (r) => r.paymentReference },
      { header: "Offres acceptées", value: (r) => (r.consentMarketing ? "oui" : "non") },
      { header: "Source", value: (r) => acquisitionSource(r.attribution) },
      { header: "utm_campaign", value: (r) => r.attribution.utmCampaign },
    ]);
    filename = `inscriptions-${day}.csv`;
  } else {
    return jsonError(400, "BAD_REQUEST", "Type d'export inconnu.");
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
