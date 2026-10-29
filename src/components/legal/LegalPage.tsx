import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";

/** Zone à compléter avant la mise en ligne (repérée par `npm run check:launch`). */
export function Todo({ children }: { children: ReactNode }) {
  return <mark>[À COMPLÉTER : {children}]</mark>;
}

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="contenu">
        <div className="container-page max-w-3xl py-12 lg:py-16">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted">Dernière mise à jour : {updated}</p>
          <p role="note" className="mt-6 rounded-xl border-l-4 border-yellow bg-mist p-4 text-sm font-semibold">
            Document modèle : les passages surlignés doivent être complétés, et l&apos;ensemble vérifié par
            un professionnel du droit, avant la mise en ligne.
          </p>
          <div className="prose-legal mt-8">{children}</div>
        </div>
      </main>
    </>
  );
}
