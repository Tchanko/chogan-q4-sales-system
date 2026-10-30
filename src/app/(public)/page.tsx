import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm } from "@/components/forms/LeadForm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CheckList } from "@/components/ui/CheckList";
import { offer } from "@/content/offer";
import { openGraph } from "@/lib/seo";
import { countryOptions } from "@/lib/validation/phone";

export const metadata: Metadata = {
  title: { absolute: "Mini-atelier gratuit : crée ton premier contenu Chogan avec l'IA" },
  description:
    "Consultant Chogan ? Découvre comment utiliser l'IA pour créer des contenus plus professionnels et structurer ta présence sur les réseaux sociaux. Démonstration gratuite.",
  alternates: { canonical: "/" },
  openGraph: openGraph({
    title: "Mini-atelier gratuit : crée ton premier contenu Chogan avec l'IA",
    description:
      "Découvre comment utiliser l'IA pour créer des contenus plus professionnels et structurer ta présence sur les réseaux sociaux.",
    url: "/",
  }),
};

export default function CapturePage() {
  const countries = countryOptions();
  return (
    <>
      <SiteHeader />
      <main id="contenu">
        <section className="relative overflow-hidden bg-ink text-paper">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full bg-cyan/15 blur-3xl"
          />
          <div className="container-page relative grid gap-10 pb-16 pt-10 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-14 lg:pb-24 lg:pt-16">
            <div className="lg:pt-6">
              <p className="eyebrow text-cyan">
                <span className="size-2 rounded-full bg-yellow" aria-hidden="true" />
                Pour les consultants et consultantes Chogan
              </p>
              <h1 className="mt-4 text-[2rem] font-extrabold leading-[1.1] sm:text-5xl">
                Tu es consultant Chogan, mais tu ne sais pas quoi publier pour attirer
                l&apos;attention&nbsp;?
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-dark">
                Découvre comment utiliser l&apos;IA pour créer des contenus plus professionnels et
                structurer ta présence sur les réseaux sociaux.
              </p>
              <div className="mt-8 hidden rounded-2xl border border-white/10 bg-ink-2 p-6 lg:block">
                <p className="font-display text-lg font-bold">Dans la démonstration</p>
                <CheckList items={offer.leadMagnet.points} tone="dark" className="mt-4 text-muted-dark" />
              </div>
            </div>

            <div className="rounded-3xl bg-paper p-6 text-ink shadow-2xl shadow-black/40 sm:p-8">
              <p className="eyebrow text-cyan-ink">Ressource gratuite</p>
              <h2 className="mt-2 text-2xl font-bold leading-tight">{offer.leadMagnet.title}</h2>
              <p className="mt-3 leading-relaxed text-muted">{offer.leadMagnet.description}</p>
              <div className="mt-6 border-t border-line pt-6">
                <LeadForm countries={countries} />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-paper py-16 lg:py-20" aria-labelledby="probleme-titre">
          <div className="container-page">
            <h2 id="probleme-titre" className="max-w-2xl text-3xl font-bold sm:text-4xl">
              Tu te reconnais dans l&apos;une de ces situations&nbsp;?
            </h2>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {offer.problems.map((p) => (
                <li key={p.title} className="rounded-2xl border border-line p-6">
                  <h3 className="text-lg font-bold">{p.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{p.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-mist py-16 lg:py-20" aria-labelledby="suite-titre">
          <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 id="suite-titre" className="text-3xl font-bold sm:text-4xl">
                Et pour aller plus loin
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted">
                Le mini-atelier est une introduction à <strong className="text-ink">{offer.name}</strong> :
                30 jours de pratique, à partir du {offer.cohorts[0].startLabel} (10 participants par session), pour construire
                ton système de création de contenu et de prospection.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <a href="#contenu" className="btn btn-dark">
                {offer.leadMagnet.masterclass.ctaLabel}
              </a>
              <Link href="/formation" className="btn btn-outline">
                Voir le programme
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
