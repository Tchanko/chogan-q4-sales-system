import type { Metadata } from "next";
import Link from "next/link";
import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { offer } from "@/content/offer";
import { formatDeadline } from "@/lib/enrollment";
import { getEnrollmentStateForPage } from "@/lib/enrollment-server";
import { openGraph } from "@/lib/seo";
import { whatsappMessages, whatsappUrl } from "@/lib/site";
import { countryOptions } from "@/lib/validation/phone";

export const metadata: Metadata = {
  title: "Demande d'inscription",
  description: `Envoie ta demande d'inscription à ${offer.name} (${offer.price.label}, du ${offer.cohort.startLabel} au ${offer.cohort.endLabel}). Confirmation sur WhatsApp après vérification du paiement.`,
  alternates: { canonical: "/inscription" },
  openGraph: openGraph({
    title: `Demande d'inscription — ${offer.name}`,
    description: `${offer.price.label}, du ${offer.cohort.startLabel} au ${offer.cohort.endLabel}. Confirmation sur WhatsApp après vérification du paiement.`,
    url: "/inscription",
  }),
};

export default async function RegistrationPage() {
  const enrollment = await getEnrollmentStateForPage();
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
              <div className="flex justify-between gap-4">
                <dt className="text-muted-dark">Dates</dt>
                <dd className="text-right font-semibold">
                  du {offer.cohort.startLabel}
                  <br />
                  au {offer.cohort.endLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-dark">Rythme</dt>
                <dd className="text-right font-semibold">{offer.cohort.rhythm}</dd>
              </div>
            </dl>
            <h3 className="mt-8 font-bold">Et ensuite ?</h3>
            <ol className="mt-3 space-y-3 text-sm text-muted-dark">
              <li>
                <strong className="text-paper">1. Demande reçue</strong> — tu reçois une référence
                d&apos;inscription.
              </li>
              <li>
                <strong className="text-paper">2. Paiement</strong> — les instructions te sont envoyées sur
                WhatsApp ; ton paiement est ensuite vérifié.
              </li>
              <li>
                <strong className="text-paper">3. Inscription confirmée</strong> — uniquement après
                vérification effective du paiement.
              </li>
            </ol>
          </aside>

          <section aria-labelledby="form-titre" className="rounded-3xl bg-paper p-6 shadow-sm sm:p-8">
            <h1 id="form-titre" className="text-3xl font-extrabold">
              Demande d&apos;inscription
            </h1>
            {enrollment.open ? (
              <>
                <p className="mt-3 text-muted">
                  Session du {offer.cohort.startLabel} au {offer.cohort.endLabel}. Inscriptions ouvertes
                  jusqu&apos;au {formatDeadline(enrollment.deadlineIso)} (heure de Paris).
                </p>
                <div className="mt-8">
                  <RegistrationForm countries={countryOptions()} />
                </div>
              </>
            ) : (
              <div className="mt-6 space-y-4" role="status">
                <p className="rounded-xl bg-yellow p-4 font-bold text-ink">
                  Les inscriptions pour la session de novembre 2026 sont closes.
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
