"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  CONSENT_EVENT,
  OPEN_PREFERENCES_EVENT,
  clearAnalyticsCookies,
  readConsent,
  saveConsent,
  type ConsentChoice,
} from "@/lib/analytics/consent";
import { site, trackingConfigured } from "@/lib/site";
import {
  installGoogleAnalytics,
  installMetaPixel,
  installTikTokPixel,
  trackClientPageView,
} from "./tracking-loaders";

/* --------------------------------------------------------------------- */
/* Lecture du consentement, compatible rendu serveur                      */
/* --------------------------------------------------------------------- */

let snapshotKey: string | null = null;
let snapshotValue: ConsentChoice | null = null;

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): ConsentChoice | null {
  const value = readConsent();
  const key = value ? `${value.analytics}|${value.marketing}|${value.decidedAt}` : "none";
  if (key !== snapshotKey) {
    snapshotKey = key;
    snapshotValue = value;
  }
  return snapshotValue;
}

/** undefined = pas encore connu (rendu serveur) ; null = aucun choix. */
function useConsent(): ConsentChoice | null | undefined {
  return useSyncExternalStore<ConsentChoice | null | undefined>(subscribe, getSnapshot, () => undefined);
}

/* --------------------------------------------------------------------- */

export function ConsentManager() {
  // Aucun outil configuré : aucun traceur, donc aucun bandeau à afficher.
  if (!trackingConfigured) return null;
  return <ConsentManagerInner />;
}

function ConsentManagerInner() {
  const consent = useConsent();
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    const open = () => setPreferencesOpen(true);
    window.addEventListener(OPEN_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, open);
  }, []);

  const decide = (choice: { analytics: boolean; marketing: boolean }) => {
    const previous = readConsent();
    saveConsent(choice);
    setPreferencesOpen(false);
    const revoked =
      (previous?.analytics && !choice.analytics) || (previous?.marketing && !choice.marketing);
    if (revoked) {
      // Les scripts déjà chargés ne peuvent pas être déchargés : on recharge la page.
      clearAnalyticsCookies();
      window.location.reload();
    }
  };

  return (
    <>
      <TrackingScripts consent={consent ?? null} />
      {consent === null && !preferencesOpen && (
        <ConsentBanner
          onAcceptAll={() => decide({ analytics: true, marketing: true })}
          onRejectAll={() => decide({ analytics: false, marketing: false })}
          onCustomize={() => setPreferencesOpen(true)}
        />
      )}
      {preferencesOpen && (
        <PreferencesDialog
          initial={consent ?? null}
          onSave={decide}
          onClose={() => setPreferencesOpen(false)}
        />
      )}
    </>
  );
}

function TrackingScripts({ consent }: { consent: ConsentChoice | null }) {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const analytics = consent?.analytics === true;
  const marketing = consent?.marketing === true;

  useEffect(() => {
    if (analytics && site.tracking.ga4Id) installGoogleAnalytics(site.tracking.ga4Id);
  }, [analytics]);

  useEffect(() => {
    if (!marketing) return;
    if (site.tracking.metaPixelId) installMetaPixel(site.tracking.metaPixelId);
    if (site.tracking.tiktokPixelId) installTikTokPixel(site.tracking.tiktokPixelId);
  }, [marketing]);

  // Pages vues lors des navigations internes (la première est envoyée à l'installation).
  useEffect(() => {
    if (lastPath.current !== null && lastPath.current !== pathname && marketing) trackClientPageView();
    lastPath.current = pathname;
  }, [pathname, marketing]);

  return null;
}

function ConsentBanner(props: {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onCustomize: () => void;
}) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink text-paper shadow-2xl"
    >
      <div className="container-page flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 id={titleId} className="text-base font-bold">
            Ta vie privée, ton choix
          </h2>
          <p className="mt-1 text-sm text-muted-dark">
            Avec ton accord, nous utilisons des outils de mesure d&apos;audience et de publicité pour
            savoir quelles annonces fonctionnent. Tu peux refuser sans que cela change ton accès au
            site.{" "}
            <a href="/confidentialite#cookies" className="font-semibold text-cyan underline underline-offset-2">
              En savoir plus
            </a>
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn btn-outline-light min-h-11 text-sm" onClick={props.onRejectAll}>
            Tout refuser
          </button>
          <button type="button" className="btn btn-outline-light min-h-11 text-sm" onClick={props.onCustomize}>
            Personnaliser
          </button>
          <button type="button" className="btn btn-outline-light min-h-11 text-sm" onClick={props.onAcceptAll}>
            Tout accepter
          </button>
        </div>
      </div>
    </section>
  );
}

function PreferencesDialog(props: {
  initial: ConsentChoice | null;
  onSave: (choice: { analytics: boolean; marketing: boolean }) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [analytics, setAnalytics] = useState(props.initial?.analytics ?? false);
  const [marketing, setMarketing] = useState(props.initial?.marketing ?? false);
  const { onClose } = props;

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    const handleClose = () => onClose();
    dialog?.addEventListener("close", handleClose);
    return () => dialog?.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl bg-paper p-0 text-ink backdrop:bg-black/60"
    >
      <form
        method="dialog"
        className="p-6"
        onSubmit={(e) => {
          e.preventDefault();
          props.onSave({ analytics, marketing });
        }}
      >
        <h2 id={titleId} className="text-xl font-bold">
          Préférences de cookies
        </h2>
        <p className="mt-2 text-sm text-muted">
          Les cookies strictement nécessaires au fonctionnement du site (sécurité, mémorisation de ce
          choix) sont toujours actifs. Les autres ne sont déposés qu&apos;avec ton accord.
        </p>
        <fieldset className="mt-5 space-y-4">
          <legend className="sr-only">Catégories de traceurs</legend>
          <label className="flex gap-3 rounded-xl border border-line p-4">
            <input
              type="checkbox"
              className="mt-1 size-5 shrink-0 accent-ink"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
            />
            <span>
              <span className="block font-semibold">Mesure d&apos;audience</span>
              <span className="block text-sm text-muted">
                Google Analytics : nombre de visites et pages consultées.
              </span>
            </span>
          </label>
          <label className="flex gap-3 rounded-xl border border-line p-4">
            <input
              type="checkbox"
              className="mt-1 size-5 shrink-0 accent-ink"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
            />
            <span>
              <span className="block font-semibold">Publicité</span>
              <span className="block text-sm text-muted">
                Pixels Meta (Facebook, Instagram) et TikTok : mesure de l&apos;efficacité des annonces.
              </span>
            </span>
          </label>
        </fieldset>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-outline min-h-11 text-sm" onClick={() => ref.current?.close()}>
            Annuler
          </button>
          <button type="submit" className="btn btn-dark min-h-11 text-sm">
            Enregistrer mes choix
          </button>
        </div>
      </form>
    </dialog>
  );
}
