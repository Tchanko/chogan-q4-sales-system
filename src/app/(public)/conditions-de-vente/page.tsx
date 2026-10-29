import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Todo } from "@/components/legal/LegalPage";
import {
  GUARANTEE_DAYS,
  GUARANTEE_DECISION_LABELS,
  PRACTICE_DAYS,
  SUPPORT_DAYS,
  guaranteeContract,
  guaranteeDeliverables,
  type GuaranteeDecisions,
} from "@/content/guarantee";
import { offer } from "@/content/offer";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: `Conditions générales de vente de la formation ${offer.name}.`,
  alternates: { canonical: "/conditions-de-vente" },
};

const practical = offer.sessions.practical;

export default function TermsPage() {
  return (
    <LegalPage title="Conditions générales de vente" updated="29 octobre 2026">
      <p>
        Version : {offer.legal.termsVersion}. Les présentes conditions s&apos;appliquent à la formation{" "}
        {offer.name} vendue par Tchanko Chirac (coordonnées complètes dans les{" "}
        <Link href="/mentions-legales">mentions légales</Link>).
      </p>

      <h2>1. Objet et contenu de la formation</h2>
      <p>
        La formation se déroule du {offer.cohort.startLabel} au {offer.cohort.endLabel}, à raison de{" "}
        {offer.cohort.rhythm}, en format {offer.cohort.format}. Le programme détaillé figure sur la{" "}
        <Link href="/formation">page de présentation</Link>.
      </p>
      <p>
        Modalités pratiques : formation {practical.mode}, via {practical.tool} ; sessions {practical.days},
        d&apos;une durée de {practical.duration} chacune.
        {practical.replays && " Les sessions sont enregistrées et leurs replays sont mis à disposition des participants."}{" "}
        Les sessions commencent à {practical.startTimes}.
      </p>
      <p>Les bonus sont remis au fur et à mesure de leur utilisation pendant la formation.</p>

      <h2>2. Prix</h2>
      <p>
        Le prix de la formation est de {offer.price.label}, identique quel que soit le moyen de paiement.{" "}
        {offer.price.vatNote}
      </p>
      <p>
        Un budget publicitaire de {offer.adBudget.label} par participant est demandé pour la partie Facebook
        Ads. Ce budget reste à la charge du participant, de même que les outils utilisés pendant la formation.
      </p>

      <h2>3. Processus d&apos;inscription</h2>
      <ol className="list-decimal pl-5">
        <li>Le participant envoie une demande d&apos;inscription en ligne et reçoit une référence.</li>
        <li>Les instructions de paiement lui sont transmises sur WhatsApp.</li>
        <li>
          L&apos;inscription est confirmée uniquement après vérification effective de la réception du paiement.
        </li>
      </ol>

      <h2>4. Paiement</h2>
      <p>
        Moyens de paiement acceptés : {offer.paymentMethods.map((m) => m.label).join(", ")}. Aucun frais
        supplémentaire n&apos;est appliqué selon le moyen de paiement choisi. Aucune donnée bancaire n&apos;est
        collectée sur ce site.
      </p>

      <h2>5. Droit de rétractation</h2>
      <p>
        Lorsqu&apos;il agit en qualité de consommateur, le participant dispose d&apos;un délai de 14 jours à
        compter de la conclusion du contrat pour exercer son droit de rétractation, sans avoir à motiver sa
        décision.
      </p>
      <p>
        Si, à sa demande expresse, la formation commence avant la fin de ce délai, le participant qui se
        rétracte reste redevable d&apos;un montant proportionnel aux sessions déjà suivies jusqu&apos;à la
        communication de sa décision. Le droit de rétractation ne peut plus être exercé une fois la formation
        entièrement exécutée.
      </p>
      <p>
        Pour exercer ce droit, le participant adresse une déclaration dénuée d&apos;ambiguïté par e-mail à{" "}
        <a href={`mailto:${offer.seller.email}`}>{offer.seller.email}</a>. Un formulaire type de rétractation
        lui est alors transmis par e-mail ; son utilisation est facultative. Les sommes à restituer sont
        remboursées au plus tard 14 jours après réception de sa décision, par le même moyen de paiement que
        celui utilisé, sauf accord contraire.
      </p>

      <h2>6. Annulation ou report par l&apos;organisateur</h2>
      <p>
        Le formateur peut reporter une session sans condition. La date de report est fixée en fonction de la
        disponibilité des participants.
      </p>
      <p>
        En cas d&apos;annulation de la formation par l&apos;organisateur :{" "}
        <Todo>conditions et remboursement en cas d&apos;annulation de la formation</Todo>.
      </p>

      <h2 id="garantie">7. {guaranteeContract.title}</h2>

      <p>
        La garantie {GUARANTEE_DAYS} jours est soumise aux critères et modalités prévus au présent
        article.
      </p>

      <h3>7.1 Objet et principe</h3>
      <p>La garantie {GUARANTEE_DAYS} jours — Contenu &amp; Performance s&apos;organise ainsi :</p>
      <ul>
        <li>
          une période de mise en pratique de {PRACTICE_DAYS} jours, correspondant à la formation en direct
          avec partage d&apos;écran (du {offer.cohort.startLabel} au {offer.cohort.endLabel}) ;
        </li>
        <li>
          si, au terme de cette période, le participant qui a respecté les articles 7.2 à 7.5 n&apos;a obtenu
          aucun résultat positif au sens de l&apos;article 7.7, une période de {SUPPORT_DAYS} jours
          d&apos;accompagnement individuel supplémentaire, sans frais, dans les conditions de
          l&apos;article 7.6.
        </li>
      </ul>
      <p>
        Si, au terme de cet accompagnement, ces conditions restent respectées et qu&apos;aucun résultat
        positif n&apos;est obtenu, le participant peut solliciter le remboursement intégral de la somme
        effectivement payée, soit {offer.price.label}, selon les articles 7.8 et 7.9.
      </p>

      <h3>7.2 Critères de participation</h3>
      <ul>
        <li>
          Présence : <Decision k="attendance" />
        </li>
        <li>
          Absences justifiées : <Decision k="absenceJustification" /> <Decision k="absenceProof" />
        </li>
        <li>
          Rattrapage : <Decision k="catchUp" />
        </li>
        <li>
          Informations produits : <Decision k="productInformation" /> Voir aussi l&apos;article 7.11.
        </li>
      </ul>

      <h3>7.3 Publication quotidienne à des heures planifiées</h3>
      <p>
        Le participant publie chaque jour les contenus prévus dans son calendrier éditorial, aux heures
        qu&apos;il a planifiées :
      </p>
      <ul>
        <li>
          Nombre de publications : <Decision k="dailyPublication" />
        </li>
        <li>
          Publications prises en compte et durée : <Decision k="publicationRules" />
        </li>
        <li>
          Début de l&apos;obligation : <Decision k="publicationPeriod" />
        </li>
        <li>
          Heures de publication : <Decision k="publicationSchedule" />
        </li>
      </ul>

      <h3>7.4 Exercices et travaux</h3>
      <p>
        <Decision k="exercises" /> <Decision k="exerciseDeadlines" />
      </p>

      <h3>7.5 Preuves requises</h3>
      <p>
        7.5.1 Le respect des articles 7.2 à 7.4 et, le cas échéant, la progression prévue à l&apos;article
        7.7 sont établis par les preuves suivantes : <Decision k="proofs" />
      </p>
      <p>
        7.5.2 Preuves de présence : <Decision k="attendanceProof" />
      </p>
      <p>
        7.5.3 Le participant conserve ces preuves au fur et à mesure et les transmet, dans leur ensemble, avec
        sa demande de remboursement, aux coordonnées suivantes : <Decision k="officialContacts" />.
      </p>
      <p>
        7.5.4 Avant transmission, le participant masque les informations de tiers non nécessaires à la preuve
        (noms, photos, commentaires, messages privés, coordonnées). Les preuves servent uniquement à
        l&apos;examen de la garantie. <Decision k="proofsRetention" />
      </p>
      <p>
        7.5.5 <Decision k="incompleteClaim" />
      </p>

      <h3>7.6 Suivi individuel</h3>
      <p>
        Lorsque les conditions de l&apos;article 7.1 sont réunies, le participant bénéficie de {SUPPORT_DAYS}{" "}
        jours d&apos;accompagnement individuel supplémentaire, sans frais. <Decision k="supportRequest" />{" "}
        <Decision k="individualSupport" />
      </p>

      <h3>7.7 Critères pédagogiques d&apos;évaluation</h3>
      <p>
        7.7.1 Résultat positif. <Decision k="evaluation" />
      </p>
      <p>
        7.7.2 Compétences visées. Les compétences visées sont les objectifs pédagogiques publiés sur la{" "}
        <Link href="/formation">page de présentation</Link> à la date de l&apos;inscription. Les livrables
        couverts par la garantie, réalisés pendant la formation, sont :
      </p>
      <ol className="list-decimal pl-5">
        {guaranteeDeliverables.map((d) => (
          <li key={d.title}>
            {d.title}
            {d.detail ? ` : ${d.detail.replace(/\.$/, "")}` : ""}.
          </li>
        ))}
      </ol>
      <p>
        <Decision k="competenceAssessment" />
      </p>
      <p>7.7.3 Mesure de la progression :</p>
      <ul>
        <li>
          Plateformes : <Decision k="progressScope" />
        </li>
        <li>
          Relevés et périodes comparées : <Decision k="progressPeriods" />
        </li>
        <li>
          Seuil : <Decision k="progressThreshold" />
        </li>
        <li>
          Indicateur parti de zéro : <Decision k="zeroBaselineMinimum" />
        </li>
      </ul>

      <h3>7.8 Délais de réclamation</h3>
      <p>
        <Decision k="claimDeadline" /> Coordonnées : <Decision k="officialContacts" />.
      </p>

      <h3>7.9 Procédure de remboursement</h3>
      <p>
        Le remboursement porte sur l&apos;intégralité de la somme effectivement payée, soit {offer.price.label}.{" "}
        <Decision k="refundProcedure" /> <Decision k="refundDelay" />
      </p>

      <h3>7.10 Portée de la garantie</h3>
      <p>
        La garantie ne constitue pas un engagement sur un niveau de ventes ou de chiffre d&apos;affaires, ni
        sur un nombre déterminé de vues, d&apos;abonnés ou de mentions « J&apos;aime ». Elle ouvre droit au
        remboursement uniquement dans le cas prévu à l&apos;article 7.1. Elle ne prive pas le participant des
        droits que lui reconnaît la loi, notamment le droit de rétractation lorsqu&apos;il s&apos;applique.
      </p>

      <h3>7.11 Contenus et allégations produits</h3>
      <p>
        Le participant est seul responsable des contenus qu&apos;il publie, notamment de l&apos;exactitude
        des informations et allégations relatives aux produits qu&apos;il présente, du respect des règles de
        communication fixées par Chogan pour ses consultants, des réglementations applicables à ces produits
        et des règles des plateformes utilisées. Les exemples et modèles fournis pendant la formation ne
        valent pas validation de ces allégations.
      </p>

      <h2>8. Absence d&apos;engagement sur des résultats chiffrés</h2>
      <p>
        La formation transmet une méthode et des compétences. En dehors du mécanisme de remboursement prévu à
        l&apos;article 7, aucun résultat chiffré (ventes, vues, abonnés, prospects) n&apos;est garanti. La
        formation est indépendante de la société Chogan ; le participant reste responsable du respect des
        règles fixées par Chogan pour ses consultants et des règles publicitaires des plateformes utilisées.
      </p>

      <h2>9. Propriété intellectuelle</h2>
      <p>
        Les supports remis sont réservés à l&apos;usage personnel du participant et ne peuvent être
        reproduits ni diffusés sans autorisation.
      </p>

      <h2>10. Données personnelles</h2>
      <p>
        Voir la <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>11. Droit applicable, médiation et litiges</h2>
      <p>
        Le prestataire est établi au Cameroun. Les présentes conditions sont soumises au droit camerounais.
        Ce choix ne prive pas le participant consommateur résidant dans un autre pays de la protection que lui
        assurent les dispositions impératives de la loi de son pays de résidence.
      </p>
      <p>
        En cas de litige, les parties recherchent d&apos;abord une solution amiable (contact :{" "}
        <a href={`mailto:${offer.seller.email}`}>{offer.seller.email}</a>). À défaut, elles peuvent recourir à
        une médiation conformément à l&apos;Acte uniforme OHADA relatif à la médiation. À défaut d&apos;accord,
        les juridictions du Cameroun sont compétentes, sous la même réserve des règles impératives protégeant
        le consommateur.
      </p>
    </LegalPage>
  );
}

/** Paramètre de la garantie : sa valeur une fois décidée, sinon un passage « À COMPLÉTER ». */
function Decision({ k }: { k: keyof GuaranteeDecisions }) {
  const value = guaranteeContract.pendingDecisions[k]?.trim();
  return value ? <>{value}</> : <Todo>{GUARANTEE_DECISION_LABELS[k]}</Todo>;
}
