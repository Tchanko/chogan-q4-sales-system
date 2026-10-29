import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Todo } from "@/components/legal/LegalPage";
import { GUARANTEE_DAYS } from "@/content/guarantee";
import { offer } from "@/content/offer";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: `Comment ${offer.name} collecte, utilise et protège tes données personnelles.`,
  alternates: { canonical: "/confidentialite" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="29 octobre 2026">
      <h2>Responsable du traitement</h2>
      <p>
        {offer.seller.name}, {offer.seller.address}, joignable à{" "}
        <a href={`mailto:${offer.seller.email}`}>{offer.seller.email}</a>.
      </p>

      <h2>Données collectées et finalités</h2>
      <h3>Demande du mini-atelier gratuit (page d&apos;accueil)</h3>
      <ul>
        <li>Données : prénom, numéro WhatsApp, adresse e-mail (facultative), difficulté principale, date et version du consentement, source de la visite (paramètres de campagne, site d&apos;origine).</li>
        <li>Finalités : t&apos;envoyer la démonstration et te contacter au sujet de la formation {offer.name}.</li>
        <li>Base légale : ton consentement, que tu peux retirer à tout moment.</li>
      </ul>
      <h3>Demande d&apos;inscription</h3>
      <ul>
        <li>Données : nom et prénom, numéro WhatsApp, adresse e-mail (facultative), pays de résidence, moyen de paiement souhaité, consentements, référence d&apos;inscription, source de la visite.</li>
        <li>Finalités : traiter ta demande, t&apos;envoyer les instructions de paiement, vérifier le paiement et gérer ta participation.</li>
        <li>Base légale : mesures précontractuelles et exécution du contrat ; obligations légales (comptabilité).</li>
      </ul>
      <h3>Paiement</h3>
      <p>
        Aucune donnée bancaire (numéro de carte, IBAN) n&apos;est collectée ni stockée par ce site. Seule une
        référence de transaction est conservée pour attester de la vérification du paiement.
      </p>
      <h3>Garantie {GUARANTEE_DAYS} jours</h3>
      <ul>
        <li>Données : captures et liens de publications, statistiques des comptes retenus, exercices, éléments de présence, justificatifs d&apos;absence et échanges de suivi individuel.</li>
        <li>Finalités : mettre en œuvre la garantie et examiner une éventuelle demande de remboursement. Base légale : exécution du contrat.</li>
        <li>Transmission : par WhatsApp ou par e-mail. Les informations de tiers non nécessaires (noms, photos, commentaires, messages privés) doivent être masquées avant l&apos;envoi.</li>
        <li>Conservation : jusqu&apos;à l&apos;expiration du délai pendant lequel une action liée au contrat peut être engagée.</li>
      </ul>
      <h3>Sécurité du site</h3>
      <p>
        Pour limiter les envois abusifs, une empreinte non réversible de l&apos;adresse IP est utilisée
        pendant une durée maximale de 24 heures (intérêt légitime). L&apos;adresse IP en clair n&apos;est pas
        enregistrée en base de données.
      </p>

      <h2>Destinataires et sous-traitants</h2>
      <ul>
        <li>Hébergement du site : <Todo>hébergeur et localisation</Todo>.</li>
        <li>Base de données : Supabase — <Todo>région d&apos;hébergement</Todo>.</li>
        <li>Échanges sur WhatsApp : WhatsApp (groupe Meta), selon ses propres conditions.</li>
        <li>Mesure d&apos;audience et publicité, uniquement avec ton accord : Google (Google Analytics), Meta (pixel Facebook / Instagram), TikTok.</li>
      </ul>
      <p>
        Tes données ne sont ni vendues ni cédées. Transferts hors de l&apos;Union européenne :{" "}
        <Todo>préciser les transferts et les garanties (clauses contractuelles types, décision d&apos;adéquation)</Todo>.
      </p>

      <h2>Durées de conservation</h2>
      <ul>
        <li>Prospects : <Todo>durée, ex. 3 ans à compter du dernier contact</Todo>, ou jusqu&apos;à ta désinscription.</li>
        <li>Inscrits : pendant la relation contractuelle, puis <Todo>durée de prescription applicable</Todo>.</li>
        <li>Pièces comptables : <Todo>durée légale, ex. 10 ans en France</Todo>.</li>
        <li>Choix relatifs aux cookies : 6 mois.</li>
      </ul>

      <h2>Tes droits</h2>
      <p>
        Tu disposes d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, d&apos;opposition, de
        limitation et de portabilité de tes données, ainsi que du droit de retirer ton consentement à tout
        moment. Pour les exercer : <a href={`mailto:${offer.seller.email}`}>{offer.seller.email}</a>. Pour ne plus recevoir de messages, utilise
        la page <Link href="/desinscription">désinscription</Link> ou réponds « STOP » sur WhatsApp.
      </p>
      <p>
        Tu peux introduire une réclamation auprès de l&apos;autorité de protection des données compétente
        (en France : la CNIL, www.cnil.fr) <Todo>adapter selon le pays de l&apos;éditeur</Todo>.
      </p>

      <h2 id="cookies">Cookies et traceurs</h2>
      <h3>Strictement nécessaires (toujours actifs)</h3>
      <ul>
        <li>
          <strong>cq4_reg</strong> (cookie, 90 jours) : relie ton navigateur à ta demande d&apos;inscription pour
          afficher son statut.
        </li>
        <li>
          <strong>cq4_admin</strong> (cookie, 8 heures) : session sécurisée de l&apos;espace d&apos;administration.
        </li>
        <li>
          <strong>cq4_consent</strong> (stockage local, 6 mois) : mémorise tes choix de cookies.
        </li>
        <li>
          <strong>cq4_attribution</strong> (stockage de session, effacé à la fermeture de l&apos;onglet) : source de
          ta visite, transmise uniquement si tu envoies un formulaire.
        </li>
      </ul>
      <h3>Soumis à ton accord</h3>
      <ul>
        <li>Mesure d&apos;audience : Google Analytics 4 (cookies _ga, _ga_*).</li>
        <li>Publicité : pixel Meta (_fbp, _fbc) et pixel TikTok (_ttp).</li>
      </ul>
      <p>
        Ces outils ne sont chargés qu&apos;après ton accord. Tu peux modifier ton choix à tout moment via le
        lien « Gérer les cookies » en bas de page (affiché lorsque ces outils sont activés).
      </p>
    </LegalPage>
  );
}
