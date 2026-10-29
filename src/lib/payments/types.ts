/**
 * Contrat d'intégration d'un prestataire de paiement.
 *
 * Aucun prestataire n'est branché pour l'instant : le parcours d'inscription
 * est une demande avec confirmation manuelle sur WhatsApp. Pour en ajouter un
 * (après vérification de sa compatibilité avec votre statut et votre pays),
 * implémentez cette interface dans src/lib/payments/<prestataire>.ts puis
 * déclarez-le dans src/lib/payments/index.ts. Voir le README, section
 * « Brancher un prestataire de paiement ».
 */

export interface CheckoutRequest {
  registrationId: string;
  reference: string;
  amountCents: number;
  currency: string;
  customerEmail: string | null;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Événement normalisé, produit UNIQUEMENT après vérification cryptographique
 * de la notification du prestataire (signature du webhook).
 */
export interface VerifiedPaymentEvent {
  type: "payment.succeeded" | "payment.failed" | "payment.refunded";
  provider: string;
  /** Référence d'inscription transmise au prestataire lors du paiement (ex. CQ4-7KX2PM). */
  registrationReference: string;
  /** Identifiant de transaction côté prestataire (aucune donnée bancaire). */
  providerTransactionId: string;
  amountCents: number;
  currency: string;
}

export interface PaymentProvider {
  readonly id: string;
  /** Crée une session de paiement hébergée chez le prestataire et renvoie son URL. */
  createCheckout(request: CheckoutRequest): Promise<{ url: string }>;
  /**
   * Vérifie la signature de la notification et renvoie l'événement normalisé,
   * ou null si la notification est invalide ou non pertinente.
   */
  verifyWebhook(request: Request): Promise<VerifiedPaymentEvent | null>;
}
