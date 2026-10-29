"use client";

import { useEffect } from "react";
import { CONSENT_EVENT } from "@/lib/analytics/consent";
import { trackEvent } from "@/lib/analytics/track";

/**
 * Événement « paiement confirmé ». N'est rendu par la page de confirmation
 * que lorsqu'un prestataire de paiement réel a confirmé le paiement.
 * Dédoublonné définitivement par identifiant d'inscription.
 */
export function TrackPurchase({
  registrationId,
  reference,
  value,
  currency,
}: {
  registrationId: string;
  reference: string;
  value: number;
  currency: string;
}) {
  useEffect(() => {
    const send = () =>
      trackEvent(
        "payment_confirmed",
        { transaction_id: reference, value, currency },
        { dedupeKey: registrationId, scope: "persistent" },
      );
    const timers = [window.setTimeout(send, 300)];
    // Après un accord donné sur cette page, on attend l'installation des outils.
    const onConsent = () => timers.push(window.setTimeout(send, 300));
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener(CONSENT_EVENT, onConsent);
    };
  }, [registrationId, reference, value, currency]);
  return null;
}
