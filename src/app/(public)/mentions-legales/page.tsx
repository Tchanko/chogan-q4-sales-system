import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Todo } from "@/components/legal/LegalPage";
import { offer } from "@/content/offer";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: `Mentions légales du site ${offer.name}.`,
  alternates: { canonical: "/mentions-legales" },
};

const seller = offer.seller;

export default function LegalNoticePage() {
  return (
    <LegalPage title="Mentions légales" updated="29 octobre 2026">
      <h2>Éditeur du site</h2>
      <p>
        Le site {offer.name} est édité par {seller.name}, prestataire {seller.status} établi au Cameroun.
      </p>
      <ul>
        <li>Adresse : {seller.address}</li>
        <li>Numéro d&apos;immatriculation : {seller.registration}</li>
        <li>Numéro de TVA intracommunautaire : non applicable (prestataire établi hors de l&apos;Union européenne)</li>
        <li>
          Contact : <a href={`mailto:${seller.email}`}>{seller.email}</a> · WhatsApp : {seller.whatsapp}
        </li>
        <li>Directeur de la publication : {seller.name}</li>
      </ul>

      <h2>Hébergement</h2>
      <p>
        Site hébergé par <Todo>nom de l&apos;hébergeur (ex. Vercel Inc., Netlify Inc.)</Todo>,{" "}
        <Todo>adresse et téléphone de l&apos;hébergeur</Todo>.
      </p>
      <p>
        Base de données hébergée par Supabase Inc. — <Todo>région d&apos;hébergement choisie (ex. Union européenne)</Todo>.
      </p>

      <h2>Indépendance vis-à-vis de Chogan</h2>
      <p>{offer.legal.disclaimer}</p>
      <p>
        Aucun logo ni élément graphique appartenant à la société Chogan n&apos;est utilisé sur ce site. Les
        participants restent responsables du respect des règles de communication fixées par Chogan pour ses
        consultants.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, visuels et supports de formation présents sur ce site sont la propriété de l&apos;éditeur,
        sauf mention contraire. Toute reproduction sans autorisation écrite est interdite.
      </p>

      <h2>Absence d&apos;engagement sur des résultats chiffrés</h2>
      <p>
        Les informations présentées décrivent des objectifs pédagogiques. En dehors de la garantie prévue à
        l&apos;article 7 des <Link href="/conditions-de-vente">conditions générales de vente</Link>, aucun
        chiffre de ventes, de vues, d&apos;abonnés ou de prospects n&apos;est garanti : les résultats dépendent
        de chaque participant.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </LegalPage>
  );
}
