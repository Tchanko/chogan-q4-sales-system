import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TrackPurchase } from "@/components/analytics/TrackPurchase";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { WhatsAppLink } from "@/components/ui/WhatsAppLink";
import { offer, paymentMethodLabel } from "@/content/offer";
import type { RegistrationStatus } from "@/lib/domain";
import { getRegistrationIdFromCookie } from "@/lib/session/registration-cookie";
import { whatsappMessages, whatsappUrl } from "@/lib/site";
import { getRepository } from "@/lib/storage";
import type { RegistrationPublicView } from "@/lib/storage/types";

export const metadata: Metadata = {
  title: "Suivi de ta demande d'inscription",
  robots: { index: false, follow: false },
};

export default function ConfirmationPage() {
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="bg-mist">
        <div className="container-page max-w-3xl py-10 lg:py-16">
          <Suspense fallback={<StatusSkeleton />}>
            <RegistrationStatusView />
          </Suspense>
        </div>
      </main>
    </>
  );
}

function StatusSkeleton() {
  return (
    <div className="rounded-3xl bg-paper p-8" aria-busy="true">
      <p className="text-muted">Chargement du statut de ta demande…</p>
    </div>
  );
}

async function RegistrationStatusView() {
  const id = await getRegistrationIdFromCookie();
  if (!id) return <NoRegistration />;
  const repo = getRepository();
  if (!repo) return <StatusUnavailable />;
  let registration: RegistrationPublicView | null;
  try {
    registration = await repo.findRegistrationPublic(id);
  } catch {
    return <StatusUnavailable />;
  }
  if (!registration) return <NoRegistration />;
  return <StatusDetails registration={registration} />;
}

const TITLES: Record<RegistrationStatus, string> = {
  request_received: "Demande d'inscription reçue",
  payment_pending: "Paiement en attente de vérification",
  confirmed: "Inscription confirmée",
  cancelled: "Demande annulée",
};

type StepState = "done" | "current" | "upcoming";

function stepStates(status: RegistrationStatus): [StepState, StepState, StepState] {
  switch (status) {
    case "request_received":
      return ["done", "current", "upcoming"];
    case "payment_pending":
      return ["done", "current", "upcoming"];
    case "confirmed":
      return ["done", "done", "done"];
    case "cancelled":
      return ["done", "upcoming", "upcoming"];
  }
}

const STATE_LABEL: Record<StepState, string> = {
  done: "Étape terminée",
  current: "Étape en cours",
  upcoming: "À venir",
};

function StatusDetails({ registration }: { registration: RegistrationPublicView }) {
  const { status, reference } = registration;
  const states = stepStates(status);
  const waUrl = whatsappUrl(whatsappMessages.registration(reference));
  const price = `${(registration.priceCents / 100).toLocaleString("fr-FR")} ${registration.currency === "EUR" ? "€" : registration.currency}`;

  const steps = [
    {
      title: "Demande d'inscription reçue",
      text: "Ta demande est enregistrée avec ta référence.",
    },
    {
      title: "Paiement en attente de vérification",
      text:
        status === "payment_pending"
          ? "Ton paiement est en cours de vérification."
          : "Tu reçois les instructions de paiement sur WhatsApp, puis ton paiement est vérifié.",
    },
    {
      title: "Inscription confirmée",
      text: "Uniquement après vérification effective de ton paiement.",
    },
  ];

  return (
    <div className="space-y-6" data-testid="registration-status" data-status={status}>
      {status === "confirmed" && registration.paymentVerificationSource === "provider" && (
        <TrackPurchase
          registrationId={registration.id}
          reference={reference}
          value={registration.priceCents / 100}
          currency={registration.currency}
        />
      )}

      <section className="rounded-3xl bg-paper p-6 sm:p-8" aria-labelledby="statut-titre">
        <p className="eyebrow text-cyan-ink">{offer.name}</p>
        <h1 id="statut-titre" className="mt-2 text-3xl font-extrabold sm:text-4xl">
          {TITLES[status]}
        </h1>

        {status !== "confirmed" && status !== "cancelled" && (
          <p className="mt-4 rounded-xl border-l-4 border-yellow bg-mist p-4 font-semibold">
            Ton inscription n&apos;est pas encore confirmée. Elle le sera uniquement après vérification
            effective de ton paiement.
          </p>
        )}
        {status === "confirmed" && (
          <p className="mt-4 rounded-xl border-l-4 border-cyan bg-mist p-4 font-semibold">
            Ton paiement a été vérifié : ta place pour la session du {offer.cohort.startLabel} est
            confirmée. Les informations d&apos;accès te sont communiquées sur WhatsApp avant le démarrage.
          </p>
        )}
        {status === "cancelled" && (
          <p className="mt-4 rounded-xl border-l-4 border-ink bg-mist p-4 font-semibold">
            Cette demande a été annulée. S&apos;il s&apos;agit d&apos;une erreur, contacte-nous sur WhatsApp en
            indiquant ta référence.
          </p>
        )}

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-ink p-4 text-paper">
            <dt className="text-xs font-bold uppercase tracking-wider text-muted-dark">Ta référence</dt>
            <dd className="mt-1 font-display text-xl font-extrabold tracking-wider" data-testid="registration-reference">
              {reference}
            </dd>
          </div>
          <div className="rounded-xl border border-line p-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-muted">Montant</dt>
            <dd className="mt-1 text-xl font-bold">{price}</dd>
          </div>
          <div className="rounded-xl border border-line p-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-muted">Moyen de paiement choisi</dt>
            <dd className="mt-1 font-semibold">{paymentMethodLabel(registration.paymentMethod)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-3xl bg-paper p-6 sm:p-8" aria-labelledby="etapes-titre">
        <h2 id="etapes-titre" className="text-xl font-bold">
          Les étapes de ton inscription
        </h2>
        <ol className="mt-6 space-y-5">
          {steps.map((step, i) => {
            const state = states[i];
            return (
              <li key={step.title} className="flex gap-4" aria-current={state === "current" ? "step" : undefined}>
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    state === "done"
                      ? "bg-cyan text-ink"
                      : state === "current"
                        ? "bg-yellow text-ink"
                        : "border-2 border-line text-muted"
                  }`}
                  aria-hidden="true"
                >
                  {state === "done" ? "✓" : i + 1}
                </span>
                <div>
                  <p className="font-bold">
                    {step.title}{" "}
                    <span className="ml-1 rounded-full bg-mist px-2 py-0.5 text-xs font-semibold text-muted">
                      {STATE_LABEL[state]}
                    </span>
                  </p>
                  <p className="mt-0.5 text-muted">{step.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {(status === "request_received" || status === "payment_pending") && (
        <section className="rounded-3xl bg-ink p-6 text-paper sm:p-8" aria-labelledby="suite-titre">
          <h2 id="suite-titre" className="text-xl font-bold">
            Prochaine étape
          </h2>
          {status === "request_received" ? (
            <p className="mt-2 text-muted-dark">
              {waUrl
                ? "Envoie ta référence sur WhatsApp pour recevoir les instructions de paiement."
                : "Les instructions de paiement te sont envoyées sur WhatsApp, au numéro indiqué dans ta demande."}
            </p>
          ) : (
            <p className="mt-2 text-muted-dark">
              Tu seras prévenu(e) sur WhatsApp dès que ton paiement aura été vérifié. Cette page affiche
              toujours le statut à jour.
            </p>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {waUrl && (
              <WhatsAppLink href={waUrl} location="confirmation" className="btn btn-primary">
                Envoyer ma référence sur WhatsApp
              </WhatsAppLink>
            )}
            {/* Lien classique : recharge la page pour lire le statut à jour. */}
            <a href="/confirmation" className="btn btn-outline-light">
              Actualiser le statut
            </a>
          </div>
        </section>
      )}

      <p className="text-center text-sm text-muted">
        Une erreur dans ta demande ? Signale-la sur WhatsApp avec ta référence. Pour ne plus recevoir nos
        messages : <Link href="/desinscription" className="underline underline-offset-2">désinscription</Link>.
      </p>
    </div>
  );
}

function NoRegistration() {
  return (
    <section className="rounded-3xl bg-paper p-6 sm:p-8" aria-labelledby="aucune-titre">
      <h1 id="aucune-titre" className="text-3xl font-extrabold">
        Aucune demande d&apos;inscription sur cet appareil
      </h1>
      <p className="mt-4 text-muted">
        Cette page affiche le suivi d&apos;une demande envoyée depuis ce navigateur. Si tu as déjà envoyé ta
        demande depuis un autre appareil, retrouve ta référence dans ta conversation WhatsApp.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/inscription" className="btn btn-dark">
          Faire une demande d&apos;inscription
        </Link>
        <Link href="/formation" className="btn btn-outline">
          Voir la formation
        </Link>
      </div>
    </section>
  );
}

function StatusUnavailable() {
  return (
    <section className="rounded-3xl bg-paper p-6 sm:p-8" role="alert">
      <h1 className="text-3xl font-extrabold">Statut momentanément indisponible</h1>
      <p className="mt-4 text-muted">
        Nous ne pouvons pas afficher le statut de ta demande pour le moment. Réessaie dans quelques
        minutes ou contacte-nous sur WhatsApp avec ta référence.
      </p>
      <a href="/confirmation" className="btn btn-dark mt-6">
        Réessayer
      </a>
    </section>
  );
}
