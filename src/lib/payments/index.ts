import "server-only";
import type { PaymentProvider } from "./types";

/**
 * Prestataire de paiement actif.
 *
 * null = parcours manuel (demande d'inscription + confirmation sur WhatsApp).
 * Ne branchez un prestataire qu'après avoir vérifié qu'il accepte votre
 * statut, votre pays et la devise EUR, puis testé ses webhooks en mode test.
 */
export function getPaymentProvider(): PaymentProvider | null {
  return null;
}

export type { PaymentProvider, VerifiedPaymentEvent, CheckoutRequest } from "./types";
