import Link from "next/link";
import { GUARANTEE_DAYS } from "@/content/guarantee";
import { offer } from "@/content/offer";
import { trackingConfigured } from "@/lib/site";
import { ConsentPreferencesLink } from "./ConsentPreferencesLink";

const links = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/conditions-de-vente", label: "Conditions de vente" },
  { href: "/desinscription", label: "Se désinscrire" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-muted-dark">
      <div className="container-page py-10">
        <nav aria-label="Informations légales">
          <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="underline-offset-4 hover:text-paper hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
            {trackingConfigured && (
              <li>
                <ConsentPreferencesLink />
              </li>
            )}
          </ul>
        </nav>
        <p className="mt-6 max-w-3xl text-xs leading-relaxed">{offer.legal.disclaimer}</p>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed" data-testid="footer-guarantee">
          Garantie {GUARANTEE_DAYS} jours : des résultats ou le remboursement intégral, en contrepartie
          d&apos;une forte implication du participant (présence, exercices, publications quotidiennes), selon
          les{" "}
          <Link href="/conditions-de-vente#garantie" className="underline underline-offset-2 hover:text-paper">
            conditions générales de vente
          </Link>
          .
        </p>
        <p className="mt-4 text-xs">© 2026 {offer.name}</p>
      </div>
    </footer>
  );
}
