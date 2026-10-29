"use client";

import Link from "next/link";
import { useEffect, type ComponentProps } from "react";
import { captureAttribution } from "@/lib/analytics/attribution";
import { CONSENT_EVENT } from "@/lib/analytics/consent";
import { trackEvent, type FunnelEvent } from "@/lib/analytics/track";

/** Mémorise la source d'acquisition dès l'arrivée sur le site. */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}

/**
 * Envoie un événement à l'affichage de la page (une fois par session).
 * Si le consentement est donné plus tard sur la même page, l'événement part
 * à ce moment-là.
 */
export function TrackOnView(props: {
  event: FunnelEvent;
  dedupeKey: string;
  params?: Record<string, string | number>;
}) {
  const { event, dedupeKey, params } = props;
  const serialized = JSON.stringify(params ?? {});
  useEffect(() => {
    const send = () =>
      trackEvent(event, JSON.parse(serialized), { dedupeKey, scope: "session" });
    const timers = [window.setTimeout(send, 300)];
    // Après un accord donné sur cette page, on attend l'installation des outils.
    const onConsent = () => timers.push(window.setTimeout(send, 300));
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener(CONSENT_EVENT, onConsent);
    };
  }, [event, dedupeKey, serialized]);
  return null;
}

/** Lien de CTA qui envoie « cta_click » (une fois par session et par emplacement). */
export function TrackedCta({
  location,
  href,
  ...props
}: ComponentProps<"a"> & { location: string; href: string }) {
  const onClick = () =>
    trackEvent("cta_click", { location }, { dedupeKey: location, scope: "session" });
  if (href.startsWith("/")) {
    return <Link href={href} {...props} onClick={onClick} />;
  }
  return <a href={href} target="_blank" rel="noopener noreferrer" {...props} onClick={onClick} />;
}
