import { NO_STORE, jsonError } from "@/lib/http/api";
import { getPaymentProvider } from "@/lib/payments";
import { applyProviderPayment } from "@/lib/services/payments";
import { getRepository } from "@/lib/storage";

/**
 * Notifications du futur prestataire de paiement.
 * Tant qu'aucun prestataire n'est branché, la route répond 501 et ne
 * modifie rien : aucune inscription ne peut être confirmée par ce biais.
 */
export async function POST(request: Request): Promise<Response> {
  const provider = getPaymentProvider();
  if (!provider) {
    return jsonError(501, "NO_PROVIDER", "Aucun prestataire de paiement n'est configuré.");
  }
  const repo = getRepository();
  if (!repo) return jsonError(503, "STORAGE_UNAVAILABLE", "Stockage indisponible.");

  const event = await provider.verifyWebhook(request);
  if (!event) return jsonError(400, "INVALID_SIGNATURE", "Notification refusée.");

  const result = await applyProviderPayment(repo, event);
  if (!result.ok) return jsonError(422, result.code, "Notification non appliquée.");

  // Emplacement prévu pour l'événement de conversion côté serveur
  // (API Conversions Meta, Measurement Protocol GA4) lorsque
  // result.value.newlyConfirmed est vrai.
  return Response.json({ ok: true }, { status: 200, headers: NO_STORE });
}
