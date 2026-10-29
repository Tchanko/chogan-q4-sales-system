"use client";

import { useEffect, useState } from "react";
import { TrackedCta } from "@/components/analytics/Tracking";

/**
 * Barre d'action fixe en bas d'écran sur mobile, affichée une fois le
 * bloc d'en-tête dépassé (et masquée quand le CTA final est visible).
 */
export function StickyCta({
  href,
  label,
  price,
  watchId,
  hideWhenId,
}: {
  href: string;
  label: string;
  price: string;
  watchId: string;
  hideWhenId: string;
}) {
  const [pastHero, setPastHero] = useState(false);
  const [finalVisible, setFinalVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(watchId);
    const final = document.getElementById(hideWhenId);
    if (!hero || !("IntersectionObserver" in window)) return;
    const heroObserver = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting));
    heroObserver.observe(hero);
    const finalObserver = new IntersectionObserver(([entry]) => setFinalVisible(entry.isIntersecting));
    if (final) finalObserver.observe(final);
    return () => {
      heroObserver.disconnect();
      finalObserver.disconnect();
    };
  }, [watchId, hideWhenId]);

  const visible = pastHero && !finalVisible;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95 px-4 py-3 backdrop-blur transition-transform duration-200 md:hidden ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-3">
        <p className="shrink-0 font-display text-lg font-extrabold text-paper">{price}</p>
        <TrackedCta
          href={href}
          location="sticky_mobile"
          className="btn btn-primary min-h-12 flex-1 px-3 text-sm"
          tabIndex={visible ? 0 : -1}
        >
          {label}
        </TrackedCta>
      </div>
    </div>
  );
}
