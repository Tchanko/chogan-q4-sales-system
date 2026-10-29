import type { Metadata } from "next";
import { UnsubscribeForm } from "@/components/forms/UnsubscribeForm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { countryOptions } from "@/lib/validation/phone";

export const metadata: Metadata = {
  title: "Se désinscrire",
  description: "Ne plus recevoir de messages au sujet de la formation CHOGAN Q4 SALES SYSTEM.",
  robots: { index: false, follow: true },
};

export default function UnsubscribePage() {
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="bg-mist">
        <div className="container-page max-w-xl py-12 lg:py-16">
          <div className="rounded-3xl bg-paper p-6 sm:p-8">
            <h1 className="text-3xl font-extrabold">Se désinscrire</h1>
            <p className="mt-3 text-muted">
              Indique le numéro WhatsApp ou l&apos;adresse e-mail utilisés dans ta demande. Tu ne recevras
              plus de messages marketing. Les messages strictement liés à une inscription en cours (paiement,
              accès à la formation) peuvent continuer à t&apos;être envoyés.
            </p>
            <div className="mt-8">
              <UnsubscribeForm countries={countryOptions()} />
            </div>
            <p className="mt-6 text-sm text-muted">
              Tu peux aussi répondre « STOP » dans la conversation WhatsApp.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
