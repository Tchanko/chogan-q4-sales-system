import type { Metadata } from "next";
import Link from "next/link";
import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SeatsCounter } from "@/components/sales/SeatsCounter";
import { balanceCents, formatEuroCents, offer } from "@/content/offer";
import { focusCohort, formatDeadline } from "@/lib/enrollment";
import { getEnrollmentStateForPage } from "@/lib/enrollment-server";
import { openGraph } from "@/lib/seo";
import { whatsappMessages, whatsappUrl } from "@/lib/site";
import { countryOptions } from "@/lib/validation/phone";

export const metadata: Metadata = {
  title: "Demande d'inscription",
  description: `Envoie ta demande d'inscription à ${offer.name} (${offer.price.label}, 10 participants maximum par session). Confirmation sur WhatsApp après vérification du paiement.`,
  alternates: { canonical: "/inscription" },
  openGraph: openGraph({
    title: `Demande d'inscription — ${offer.name}`,
    description: `${offer.price.label}, 10 participants maximum par session. Confirmation sur WhatsApp après vérification du paiement.`,
    url: "/inscription",
  }),
};

export default async function RegistrationPage() {
  const enrollment = await getEnrollmentStateForPage();
  const { cohort, availability } = focusCohort(enrollment);
  const balance = balanceCents(cohort);
  const questionUrl = whatsappUrl(whatsappMessages.question);

  return (
    <>
      <SiteHeader
        action={
          <Link href="/formation" className="text-sm font-semibold text-muted-dark underline-offset-4 hover:text-paper hover:underline">
            Voir la présentation
          </Link>
        }
      />
      <main id="contenu" className="bg-mist">
        <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_1.35fr] lg:items-start lg:gap-12 lg:py-16">
          <aside aria-labelledby="recap-titre" className="rounded-3xl bg-ink p-7 text-paper lg:sticky lg:top-8">
            <p className="eyebrow text-cyan">Récapitulatif</p>
            <h2 id="recap-titre" className="mt-2 text-2xl font-bold">
              {offer.name}
            </h2>
            <dl className="mt-6 space-y-4 border-t border-white/10 pt-6">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-dark">Prix de la formation</dt>
                <dd className="font-display text-2xl font-extrabold">{offer.price.label}</dd>
              </div>
              {cohort.deposit && (
                <div className="flex justify-between gap-4" data-testid="recap-deposit">
                  <dt className="text-muted-dark">Réservation de place</dt>
                  <dd className="text-right font-semibold">
                    {cohort.deposit.label}, déduits du prix
                    <br />
                    solde : {formatEuroCents(balance ?? 0)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-dark">Session</dt>
                <dd className="text-right font-semibold">{cohort.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-dark">Dates</dt>
                <dd className="text-right font-semibold">
                  du {cohort.startLabel}
                  <br />
                  au {cohort.endLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-dark">Rythme</dt>
                <dd className="text-right font-semibold">{offer.schedule.rhythm}</dd>
              </div>
            </dl>
            {enrollment.open && (
              <SeatsCounter availability={availability} tone="dark" className="mt-6 border-t border-white/10 pt-6" />
            )}
            <h3 className="mt-8 font-bold">Et ensuite ?</h3>
            <ol className="mt-3 space-y-3 text-sm text-muted-dark">
              <li>
                <strong className="text-paper">1. Demande reçue</strong> — tu reçois une référence
                d&apos;inscription.
              </li>
              <li>
                <strong className="text-paper">2. {cohort.deposit ? "Réservation" : "Paiement"}</strong> — les
                instructions te sont envoyées sur WhatsApp ; ton paiement est ensuite vérifié.
              </li>
              <li>
                <strong className="text-paper">
                  3. {cohort.deposit ? "Place réservée" : "Inscription confirmée"}
                </strong>{" "}
                — uniquement après vérification effective du paiement. Une demande seule ne réserve pas de
                place.
              </li>
            </ol>
          </aside>

          <section aria-labelledby="form-titre" className="rounded-3xl bg-paper p-6 shadow-sm sm:p-8">
            <h1 id="form-titre" className="text-3xl font-extrabold">
              Demande d&apos;inscription
            </h1>
            {enrollment.open && enrollment.deadlineIso ? (
              <>
                <p className="mt-3 text-muted">
                  {cohort.name} : du {cohort.startLabel} au {cohort.endLabel}. Inscriptions ouvertes
                  jusqu&apos;au {formatDeadline(enrollment.deadlineIso)} (heure de Paris), dans la limite des
                  places disponibles.
                </p>
                {cohort.deposit && (
                  <p className="mt-4 rounded-xl border-l-4 border-yellow bg-mist p-4 text-sm" data-testid="deposit-notice">
                    La {offer.cohorts[0].name} est fermée. Pour la {cohort.name}, tu réserves ta place avec{" "}
                    <strong>{cohort.deposit.label}</strong>, déduits du prix de {offer.price.label} (solde :{" "}
                    {formatEuroCents(balance ?? 0)}). La réservation n&apos;est pas remboursable si tu décides de ne
                    pas commencer la formation ; elle est remboursable avec le reste du prix si tu la suis
                    jusqu&apos;au bout, dans les conditions de la garantie.
                  </p>
                )}
                <div className="mt-8">
                  <RegistrationForm
                    countries={countryOptions()}
                    cohort={{
                      id: cohort.id,
                      name: cohort.name,
                      startLabel: cohort.startLabel,
                      depositLabel: cohort.deposit?.label ?? null,
                      balanceLabel: balance === null ? null : formatEuroCents(balance),
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="mt-6 space-y-4" role="status">
                <p className="rounded-xl bg-yellow p-4 font-bold text-ink">
                  {enrollment.reason === "manually_closed"
                    ? "Les inscriptions sont actuellement fermées."
                    : "Les inscriptions sont closes : les deux sessions sont complètes ou ont démarré."}
                </p>
                <p className="text-muted">
                  Laisse tes coordonnées pour recevoir la démonstration gratuite et être informé(e) de la
                  suite.
                </p>
                <Link href="/" className="btn btn-dark">
                  Recevoir la démonstration gratuite
                </Link>
              </div>
            )}
            {questionUrl && (
              <p className="mt-8 border-t border-line pt-6 text-sm text-muted">
                Une question avant de t&apos;inscrire ?{" "}
                <a href={questionUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">
                  Écris-nous sur WhatsApp
                </a>
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
