import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="flex-1 bg-mist">
        <div className="container-page max-w-xl py-20 text-center">
          <p className="eyebrow text-cyan-ink">Erreur 404</p>
          <h1 className="mt-2 text-3xl font-extrabold">Cette page n&apos;existe pas</h1>
          <p className="mt-3 text-muted">Le lien est peut-être incomplet ou la page a été déplacée.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="btn btn-dark">
              Démonstration gratuite
            </Link>
            <Link href="/formation" className="btn btn-outline">
              Voir la formation
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
