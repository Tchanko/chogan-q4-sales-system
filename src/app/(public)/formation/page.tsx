import type { Metadata } from "next";
import { TrackOnView, TrackedCta } from "@/components/analytics/Tracking";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CalendarMockup } from "@/components/sales/CalendarMockup";
import { GuaranteeSection } from "@/components/sales/GuaranteeSection";
import { SeatsCounter } from "@/components/sales/SeatsCounter";
import { StickyCta } from "@/components/sales/StickyCta";
import { CheckList } from "@/components/ui/CheckList";
import { balanceCents, formatEuroCents, offer } from "@/content/offer";
import { focusCohort, type EnrollmentState } from "@/lib/enrollment";
import { getEnrollmentStateForPage } from "@/lib/enrollment-server";
import { openGraph } from "@/lib/seo";
import { joinHref, site, whatsappMessages, whatsappUrl } from "@/lib/site";

const CTA_LABEL = "Je veux rejoindre CHOGAN Q4 SALES SYSTEM";

const formatEuros = (amount: number) => `${amount.toLocaleString("fr-FR")} €`;

export const metadata: Metadata = {
  title: "La formation : 30 jours pour structurer ton contenu et ta prospection",
  description: `${offer.promise} Deux sessions de 10 participants maximum, dès le ${offer.cohorts[0].startLabel}. 4 sessions par semaine, 100 % pratique.`,
  alternates: { canonical: "/formation" },
  openGraph: openGraph({
    title: `${offer.name} — 30 jours de pratique pour les consultants Chogan`,
    description: offer.promise,
    url: "/formation",
  }),
};

function SectionTitle({ id, eyebrow, title, intro, dark }: {
  id: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  dark?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow && <p className={`eyebrow ${dark ? "text-cyan" : "text-cyan-ink"}`}>{eyebrow}</p>}
      <h2 id={id} className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
        {title}
      </h2>
      {intro && (
        <p className={`mt-4 text-lg leading-relaxed ${dark ? "text-muted-dark" : "text-muted"}`}>{intro}</p>
      )}
    </div>
  );
}

/** Bandeau d'état des inscriptions (fermeture, ou passage à la Session 2). */
function EnrollmentBanner({ enrollment }: { enrollment: EnrollmentState }) {
  const { cohort } = focusCohort(enrollment);
  const first = enrollment.cohorts[0];
  let text: string | null = null;
  if (enrollment.reason === "manually_closed") {
    text = "Les inscriptions sont actuellement fermées. Inscris-toi à la démonstration gratuite pour être informé(e) de la suite.";
  } else if (!enrollment.open) {
    text = "Les inscriptions sont closes : les deux sessions sont complètes ou ont démarré. Inscris-toi à la démonstration gratuite pour être informé(e) de la suite.";
  } else if (cohort.deposit && enrollment.cohortId !== first.id) {
    const firstName = offer.cohorts[0].name;
    text = `La ${firstName} est ${first.status === "full" ? "complète" : "close"}. Les inscriptions sont ouvertes pour la ${cohort.name}, du ${cohort.startLabel} au ${cohort.endLabel} : tu réserves ta place avec ${cohort.deposit.label}, déduits du prix.`;
  }
  if (!text) return null;
  return (
    <div role="status" className="bg-yellow text-ink" data-testid="enrollment-banner">
      <p className="container-page py-3 text-center text-sm font-bold">{text}</p>
    </div>
  );
}

export default async function SalesPage() {
  const enrollment = await getEnrollmentStateForPage();
  const open = enrollment.open;
  const { cohort, availability } = focusCohort(enrollment);
  const balance = balanceCents(cohort);
  const ctaHref = open ? joinHref() : "/";
  const ctaLabel = open ? CTA_LABEL : "Recevoir la démonstration gratuite";
  const questionUrl = whatsappUrl(whatsappMessages.question);

  return (
    <>
      <TrackOnView
        event="view_sales_page"
        dedupeKey="formation"
        params={{ content_name: offer.name, value: offer.price.amountCents / 100, currency: offer.price.currency }}
      />
      <SiteHeader
        action={
          <TrackedCta href={ctaHref} location="header" className="btn btn-primary min-h-10 px-4 py-2 text-sm">
            {open ? "S'inscrire" : "Démonstration gratuite"}
          </TrackedCta>
        }
      />

      <main id="contenu">
        <EnrollmentBanner enrollment={enrollment} />

        {/* 1. Hero */}
        <section id="hero" className="relative overflow-hidden bg-ink text-paper" aria-labelledby="hero-titre">
          <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-sm font-semibold text-muted-dark">
                <span className="size-2 rounded-full bg-yellow" aria-hidden="true" />
                {cohort.name} : du {cohort.startLabel} au {cohort.endLabel}
              </p>
              <h1 id="hero-titre" className="mt-5 text-[2.1rem] font-extrabold leading-[1.08] sm:text-5xl lg:text-[3.4rem]">
                30 jours pour construire ton système de contenu et de prospection
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-dark">
                <strong className="font-semibold text-paper">{offer.name}</strong> : la formation 100 %
                pratique pour présenter les produits Chogan plus professionnellement et développer ta
                présence sur les réseaux sociaux, avec l&apos;aide de l&apos;IA.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <TrackedCta href={ctaHref} location="hero" className="btn btn-primary text-base sm:whitespace-nowrap sm:text-lg">
                  {ctaLabel}
                </TrackedCta>
                <a href="#programme" className="btn btn-outline-light sm:whitespace-nowrap">
                  Voir le programme
                </a>
              </div>
              {open && <SeatsCounter availability={availability} tone="dark" className="mt-8" />}
              <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 sm:grid-cols-4">
                {[
                  ["Dates", cohort.shortDates],
                  ["Rythme", offer.schedule.rhythm],
                  ["Format", offer.schedule.format],
                  ["Tarif", offer.price.label],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted-dark">{k}</dt>
                    <dd className="mt-1 font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="hidden lg:block">
              <CalendarMockup />
            </div>
          </div>
        </section>

        {/* 2. Problèmes */}
        <section className="py-16 lg:py-24" aria-labelledby="problemes-titre">
          <div className="container-page">
            <SectionTitle
              id="problemes-titre"
              eyebrow="Le constat"
              title="Tu veux développer ton activité Chogan sur les réseaux, mais…"
            />
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {offer.problems.map((p, i) => (
                <li key={p.title} className="rounded-2xl border border-line bg-paper p-6">
                  <span className="font-display text-sm font-bold text-cyan-ink">0{i + 1}</span>
                  <h3 className="mt-2 text-lg font-bold">{p.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{p.text}</p>
                </li>
              ))}
              <li className="flex flex-col justify-center rounded-2xl bg-ink p-6 text-paper">
                <p className="font-display text-lg font-bold">Ce n&apos;est pas un manque de motivation.</p>
                <p className="mt-2 leading-relaxed text-muted-dark">
                  C&apos;est un manque de système. C&apos;est exactement ce que la formation t&apos;aide à
                  construire.
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* 3. Méthode */}
        <section className="bg-ink py-16 text-paper lg:py-24" aria-labelledby="methode-titre">
          <div className="container-page">
            <SectionTitle id="methode-titre" eyebrow="La méthode" title={offer.method.title} intro={offer.method.intro} dark />
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {offer.method.pillars.map((p, i) => (
                <li key={p.name} className="rounded-2xl border border-white/10 bg-ink-2 p-7">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-cyan font-display text-lg font-extrabold text-ink">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-xl font-bold">{p.name}</h3>
                  <p className="mt-2 leading-relaxed text-muted-dark">{p.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 4. Résultats pédagogiques */}
        <section className="py-16 lg:py-24" aria-labelledby="resultats-titre">
          <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <SectionTitle
              id="resultats-titre"
              eyebrow="Objectifs pédagogiques"
              title="À la fin des 30 jours, tu sauras…"
              intro="Chaque compétence est travaillée en pratique, sur ta propre activité."
            />
            <div>
              <CheckList items={offer.learningOutcomes} className="text-lg" />
            </div>
          </div>
        </section>

        {/* 5. Programme */}
        <section id="programme" className="bg-mist py-16 lg:py-24" aria-labelledby="programme-titre">
          <div className="container-page">
            <SectionTitle
              id="programme-titre"
              eyebrow="Le programme"
              title="8 modules, du calendrier éditorial au plan d'action Q4"
            />
            <ol className="mt-12 grid gap-4 md:grid-cols-2">
              {offer.modules.map((m, i) => (
                <li key={m.title} className="flex gap-5 rounded-2xl bg-paper p-6">
                  <span className="font-display text-2xl font-extrabold text-cyan-ink" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">
                      <span className="sr-only">Module {i + 1} : </span>
                      {m.title}
                    </h3>
                    <p className="mt-1.5 leading-relaxed text-muted">{m.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 6. Bonus */}
        <section className="py-16 lg:py-24" aria-labelledby="bonus-titre">
          <div className="container-page">
            <SectionTitle
              id="bonus-titre"
              eyebrow="Bonus prévus"
              title="Des ressources pour gagner du temps"
            />
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {offer.bonuses.map((b) => (
                <li key={b.title} className="flex flex-col gap-4 rounded-2xl border border-line p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold leading-snug">{b.title}</h3>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                        b.available ? "bg-cyan text-ink" : "bg-mist text-muted"
                      }`}
                    >
                      {b.available ? "Disponible" : "En préparation"}
                    </span>
                  </div>
                  <p className="mt-auto text-sm text-muted" data-testid="bonus-value">
                    Valeur : <span className="font-display text-lg font-extrabold text-ink">{formatEuros(b.value)}</span>{" "}
                    · <span className="font-semibold text-ink">offert</span>
                  </p>
                </li>
              ))}
              <li
                className="flex flex-col justify-center rounded-2xl bg-ink p-6 text-paper"
                data-testid="bonus-total"
              >
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-dark">
                  Valeur totale des bonus offerts gratuitement
                </p>
                <p className="mt-2 font-display text-4xl font-extrabold text-cyan">
                  {formatEuros(offer.bonuses.reduce((sum, b) => sum + b.value, 0))}
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* 7. Fonctionnement */}
        <section className="bg-ink py-16 text-paper lg:py-24" aria-labelledby="sessions-titre">
          <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
            <SectionTitle
              id="sessions-titre"
              eyebrow="Comment ça se passe"
              title="Un mois de pratique, au rythme de 4 sessions par semaine"
              dark
            />
            <div>
              <CheckList items={offer.sessions.facts} tone="dark" className="text-lg" />
              <p className="mt-6 text-muted-dark">{offer.sessions.pendingDetails}</p>
            </div>
          </div>
        </section>

        {/* 7 bis. Garantie 60 jours (contenu : src/content/guarantee.ts, conditions dans les CGV) */}
        <GuaranteeSection ctaHref={ctaHref} ctaLabel={ctaLabel} />

        {/* 8. Prix */}
        <section id="tarif" className="py-16 lg:py-24" aria-labelledby="tarif-titre">
          <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <div>
              <SectionTitle
                id="tarif-titre"
                eyebrow="Tarif"
                title={`Ton inscription à la ${cohort.name}`}
              />
              <ol className="mt-8 space-y-4">
                {(cohort.deposit
                  ? [
                      ["Tu envoies ta demande d'inscription", "Un formulaire simple, sans paiement en ligne."],
                      [
                        `Tu règles ta réservation de ${cohort.deposit.label}`,
                        "Les instructions te sont envoyées sur WhatsApp, avec ta référence d'inscription.",
                      ],
                      [
                        "Ta place est réservée",
                        `Uniquement après vérification effective de ta réservation. Le solde de ${formatEuroCents(balance ?? 0)} se règle ensuite selon les conditions de vente.`,
                      ],
                    ]
                  : [
                      ["Tu envoies ta demande d'inscription", "Un formulaire simple, sans paiement en ligne."],
                      ["Tu reçois les instructions de paiement", "Sur WhatsApp, avec ta référence d'inscription."],
                      ["Ton inscription est confirmée", "Uniquement après vérification effective de ton paiement."],
                    ]
                ).map(([title, text], i) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-paper">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-bold">{title}</p>
                      <p className="text-muted">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-3xl bg-ink p-8 text-paper shadow-xl">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-dark">{offer.name}</p>
              <p className="mt-3 font-display text-6xl font-extrabold">{offer.price.label}</p>
              <p className="mt-2 text-muted-dark">
                {cohort.name} : du {cohort.startLabel} au {cohort.endLabel}
              </p>
              {cohort.deposit && (
                <p className="mt-4 rounded-xl bg-white/10 p-4 text-sm" data-testid="deposit-info">
                  Réservation de place : <strong className="text-paper">{cohort.deposit.label}</strong>, déduits
                  du prix. Solde : <strong className="text-paper">{formatEuroCents(balance ?? 0)}</strong>.
                </p>
              )}
              {open && <SeatsCounter availability={availability} tone="dark" className="mt-5" />}
              <CheckList
                tone="dark"
                className="mt-6 border-t border-white/10 pt-6"
                items={[
                  "8 modules pratiques",
                  "4 sessions par semaine pendant 30 jours",
                  "Les bonus prévus, dès qu'ils sont prêts",
                ]}
              />
              <p className="mt-6 text-sm text-muted-dark">
                Moyens de paiement : {offer.paymentMethods.map((m) => m.label.split(",")[0]).join(" · ")}.
                Budget publicitaire non inclus.
              </p>
              {open ? (
                <TrackedCta href={ctaHref} location="price" className="btn btn-primary mt-8 w-full text-base">
                  {CTA_LABEL}
                </TrackedCta>
              ) : (
                <p className="mt-8 rounded-xl bg-yellow p-4 text-center font-bold text-ink">Inscriptions closes</p>
              )}
            </div>
          </div>
        </section>

        {/* 10. FAQ */}
        <section className="bg-mist py-16 lg:py-24" aria-labelledby="faq-titre">
          <div className="container-page max-w-3xl">
            <SectionTitle id="faq-titre" eyebrow="Questions fréquentes" title="Tes questions, nos réponses" />
            <div className="mt-10 divide-y divide-line rounded-2xl bg-paper">
              {offer.faq.map((item) => (
                <details key={item.q} className="group px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md font-bold [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <span
                      aria-hidden="true"
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mist text-lg transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted">{item.a}</p>
                </details>
              ))}
            </div>
            {questionUrl && (
              <p className="mt-6 text-center text-muted">
                Une autre question ?{" "}
                <TrackedCta href={questionUrl} location="faq_whatsapp" className="font-bold text-ink underline underline-offset-4">
                  Écris-nous sur WhatsApp
                </TrackedCta>
              </p>
            )}
          </div>
        </section>

        {/* 11. Appel à l'action final */}
        <section id="cta-final" className="bg-ink py-16 text-paper lg:py-24" aria-labelledby="final-titre">
          <div className="container-page max-w-3xl text-center">
            <h2 id="final-titre" className="text-3xl font-extrabold leading-tight sm:text-5xl">
              Prêt(e) à structurer ton contenu pour le Q4&nbsp;?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-dark">
              30 jours de pratique, du {cohort.startLabel} au {cohort.endLabel}.{" "}
              {!open
                ? "Les inscriptions sont closes."
                : cohort.deposit
                  ? `Réserve ta place avec ${cohort.deposit.label}, déduits du prix : la confirmation se fait sur WhatsApp.`
                  : "Envoie ta demande d'inscription : la confirmation se fait sur WhatsApp."}
            </p>
            <TrackedCta href={ctaHref} location="final" className="btn btn-primary mt-8 text-base sm:text-lg">
              {ctaLabel}
            </TrackedCta>
            {site.registrationMode === "form" && open && (
              <p className="mt-4 text-sm text-muted-dark">Aucun paiement n&apos;est demandé sur ce site.</p>
            )}
          </div>
        </section>

      </main>

      <StickyCta
        href={ctaHref}
        label={open ? "Rejoindre la formation" : "Démonstration gratuite"}
        price={offer.price.label}
        watchId="hero"
        hideWhenId="cta-final"
      />
    </>
  );
}
