import { TrackedCta } from "@/components/analytics/Tracking";
import { ShieldIcon } from "@/components/ui/ShieldIcon";
import {
  GUARANTEE_DAYS,
  guaranteeDeliverables,
  guaranteeMarketing,
} from "@/content/guarantee";
import { offer } from "@/content/offer";

/**
 * Section « Garantie 60 jours » de la page de vente.
 * Communication uniquement : les critères, obligations et modalités sont
 * détaillés dans l'article 7 des CGV (/conditions-de-vente#garantie).
 */
export function GuaranteeSection({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  return (
    <section id="garantie" className="bg-mist py-16 lg:py-24" aria-labelledby="garantie-titre">
      <div className="container-page">
        {/* Accroche + sceau de garantie */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow text-cyan-ink">
              <ShieldIcon className="size-5" />
              Garantie
            </p>
            <h2 id="garantie-titre" className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">
              {guaranteeMarketing.title}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{guaranteeMarketing.principle}</p>
          </div>

          <div className="rounded-3xl bg-ink p-7 text-paper shadow-xl sm:p-8" data-testid="guarantee-seal">
            <div className="flex items-center gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-cyan text-ink">
                <ShieldIcon className="size-9" />
              </span>
              <p className="font-display leading-none">
                <span className="block text-5xl font-extrabold">{GUARANTEE_DAYS} jours</span>
                <span className="mt-2 block text-sm font-semibold uppercase tracking-wider text-muted-dark">
                  pour obtenir ton système de contenu
                </span>
              </p>
            </div>
            <p className="mt-6 border-t border-white/10 pt-6 text-lg font-bold">
              <span className="text-yellow">{offer.price.label}</span> remboursés intégralement
            </p>
            <p className="mt-1 text-muted-dark">{guaranteeMarketing.refundCondition}</p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
          {/* Fonctionnement en 3 temps */}
          <div className="rounded-3xl bg-paper p-6 sm:p-8">
            <h3 className="text-xl font-bold">Comment fonctionne la garantie</h3>
            <ol className="mt-6 space-y-6" data-testid="guarantee-steps">
              {guaranteeMarketing.steps.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full font-display font-extrabold ${
                      i === guaranteeMarketing.steps.length - 1 ? "bg-ink text-cyan" : "bg-cyan text-ink"
                    }`}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan-ink">{step.period}</p>
                    <p className="mt-0.5 font-bold">
                      <span className="sr-only">Étape {i + 1} : </span>
                      {step.title}
                    </p>
                    <p className="mt-1 leading-relaxed text-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Livrables couverts */}
          <div className="rounded-3xl bg-paper p-6 sm:p-8">
            <h3 className="text-xl font-bold">Les 5 livrables couverts par la garantie</h3>
            <ol className="mt-6 space-y-4" data-testid="guarantee-deliverables">
              {guaranteeDeliverables.map((d, i) => (
                <li key={d.title} className="flex gap-4">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-mist font-display font-extrabold text-ink"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="pt-1.5">
                    <p className="font-bold leading-snug">{d.title}</p>
                    {d.detail && <p className="mt-0.5 text-muted">{d.detail}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <TrackedCta href={ctaHref} location="guarantee" className="btn btn-primary text-base sm:whitespace-nowrap">
            {ctaLabel}
          </TrackedCta>
        </div>
      </div>
    </section>
  );
}
