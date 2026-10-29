import type { VerifiedPaymentEvent } from "@/lib/payments/types";
import type { Repository } from "@/lib/storage/types";
import { failure, success, type ServiceResult } from "./result";

export interface PaymentApplied {
  registrationId: string;
  /** false si l'inscription était déjà confirmée (notification rejouée). */
  newlyConfirmed: boolean;
}

/**
 * Applique un paiement signalé par un prestataire, APRÈS vérification de la
 * signature du webhook. Contrôle le montant et la devise, et reste idempotent :
 * une notification rejouée ne confirme pas deux fois.
 */
export async function applyProviderPayment(
  repo: Repository,
  event: VerifiedPaymentEvent,
  now: Date = new Date(),
): Promise<ServiceResult<PaymentApplied>> {
  const registration = await repo.getRegistrationByReference(event.registrationReference);
  if (!registration) return failure("NOT_FOUND");

  if (event.type !== "payment.succeeded") {
    // Les échecs et remboursements sont traités manuellement depuis l'administration.
    return success({ registrationId: registration.id, newlyConfirmed: false });
  }

  if (
    event.amountCents !== registration.priceCents ||
    event.currency.toUpperCase() !== registration.currency.toUpperCase()
  ) {
    console.error("[paiements] montant ou devise inattendus", {
      reference: registration.reference,
    });
    return failure("VALIDATION", { amount: "Montant ou devise différents du prix de la formation." });
  }

  if (registration.status === "confirmed") {
    return success({ registrationId: registration.id, newlyConfirmed: false });
  }
  if (registration.status === "cancelled") return failure("INVALID_TRANSITION");

  await repo.updateRegistration(registration.id, {
    status: "confirmed",
    paymentVerifiedAt: now.toISOString(),
    paymentVerificationSource: "provider",
    paymentProvider: event.provider,
    paymentReference: event.providerTransactionId.slice(0, 200),
  });
  return success({ registrationId: registration.id, newlyConfirmed: true });
}
