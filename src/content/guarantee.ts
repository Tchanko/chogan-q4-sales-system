/**
 * Garantie 60 jours — Contenu & Performance : fichier de configuration.
 *
 * Deux usages strictement séparés :
 * - `marketing` : ce qu'affiche la page de vente /formation (principe, sans
 *   liste d'obligations) ;
 * - `contract` : ce qu'affichent les conditions générales de vente
 *   (/conditions-de-vente#garantie).
 *
 * Les paramètres qui demandent encore une décision du vendeur sont dans
 * `contract.pendingDecisions` (null = non décidé). Tant qu'un paramètre vaut
 * null, les CGV affichent « À COMPLÉTER » à sa place et `npm run check:launch`
 * bloque la mise en ligne. Ils ne sont jamais présentés comme validés.
 *
 * Avant publication :
 * 1. renseigner chaque paramètre de `pendingDecisions` ;
 * 2. passer `termsFinalized` à true ;
 * 3. faire relire la garantie et les CGV par un professionnel du droit,
 *    puis passer `legalReviewDone` à true (jamais affiché sur le site).
 *
 * Règle éditoriale : résultat positif = compétences acquises OU progression
 * mesurable d'au moins un indicateur (vues, abonnés, « J'aime »). Les ventes et
 * le chiffre d'affaires ne sont jamais des critères de résultat.
 */
import { offer } from "./offer";

export const PRACTICE_DAYS = 30;
export const SUPPORT_DAYS = 30;
export const GUARANTEE_DAYS = PRACTICE_DAYS + SUPPORT_DAYS;

/** Les 5 livrables couverts (affichés sur la page de vente et repris comme critères dans les CGV). */
export const guaranteeDeliverables = [
  { title: "Un calendrier éditorial de 30 jours", detail: null },
  { title: "12 contenus finalisés", detail: "8 visuels ou carrousels et 4 vidéos courtes." },
  { title: "Des hooks, scripts et appels à l'action", detail: null },
  { title: "Des profils sociaux optimisés", detail: null },
  {
    title: "Un plan d'action commercial et une préparation de campagne Facebook Ads",
    detail: null,
  },
] as const;

/* ------------------------------------------------------------------ */
/* Page de vente : communication marketing                             */
/* ------------------------------------------------------------------ */

export const guaranteeMarketing = {
  title: `Garantie ${GUARANTEE_DAYS} jours`,
  principle: `Tu as ${GUARANTEE_DAYS} jours pour obtenir ton système de contenu : ${PRACTICE_DAYS} jours de mise en pratique, puis, si nécessaire, ${SUPPORT_DAYS} jours d'accompagnement individuel supplémentaire, sans frais.`,
  /** Condition affichée sous « 297 € remboursés intégralement » (texte choisi par le vendeur). */
  refundCondition: "Si tu n'obtiens pas de résultats.",
  steps: [
    {
      period: `Jours 1 à ${PRACTICE_DAYS}`,
      title: "Mise en pratique",
      text: "Tu suis la formation en direct, avec partage d'écran, et tu pratiques tes exercices, session après session.",
    },
    {
      period: `Jours ${PRACTICE_DAYS + 1} à ${GUARANTEE_DAYS}`,
      title: "Accompagnement individuel, si nécessaire",
      text: `Si, après avoir fait tes exercices, tu n'as obtenu aucun résultat au bout de ${PRACTICE_DAYS} jours (compétences acquises ou progression de tes vues, abonnés ou « J'aime »), on t'accompagne en individuel pendant ${SUPPORT_DAYS} jours supplémentaires, sans frais.`,
    },
    {
      period: "Si besoin",
      title: `Remboursement intégral de ${offer.price.label}`,
      text: "Si, après avoir suivi cet accompagnement et mis en place le système vu pendant la formation, tu n'obtiens pas de résultat, tu peux solliciter le remboursement intégral de la formation.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* CGV : conditions contractuelles                                      */
/* ------------------------------------------------------------------ */

/** Paramètres qui demandent encore une décision du vendeur (null = non décidé). */
export interface GuaranteeDecisions {
  attendance: string | null;
  absenceJustification: string | null;
  catchUp: string | null;
  productInformation: string | null;
  dailyPublication: string | null;
  publicationPeriod: string | null;
  publicationSchedule: string | null;
  exercises: string | null;
  proofs: string | null;
  individualSupport: string | null;
  evaluation: string | null;
  claimDeadline: string | null;
  refundProcedure: string | null;
  absenceProof: string | null;
  publicationRules: string | null;
  exerciseDeadlines: string | null;
  attendanceProof: string | null;
  officialContacts: string | null;
  proofsRetention: string | null;
  incompleteClaim: string | null;
  supportRequest: string | null;
  competenceAssessment: string | null;
  progressScope: string | null;
  progressPeriods: string | null;
  progressThreshold: string | null;
  zeroBaselineMinimum: string | null;
  refundDelay: string | null;
}

/** Intitulés des décisions, utilisés dans les CGV, le README et check:launch. */
export const GUARANTEE_DECISION_LABELS: Record<keyof GuaranteeDecisions, string> = {
  attendance: "règle de présence aux sessions",
  absenceJustification: "motifs d'absence considérés comme justifiés, justificatifs acceptés et délai de transmission",
  catchUp: "rattrapage des sessions manquées",
  productInformation: "informations produits à fournir et délai de transmission",
  dailyPublication: "nombre de publications par jour et plateformes concernées",
  publicationPeriod: "date à partir de laquelle les publications quotidiennes sont exigées",
  publicationSchedule: "heures de publication planifiées",
  exercises: "liste des exercices et travaux à remettre, avec leurs délais",
  proofs: "preuves à fournir (captures, liens, exports…) et canal de transmission",
  individualSupport: "format, fréquence et durée des échanges de suivi individuel",
  evaluation:
    "définition mesurable des « résultats » ouvrant droit au remboursement (dont « contenu qui vend ou qui capte l'attention »), seuil de validation de chaque livrable, personne qui évalue et date d'évaluation",
  claimDeadline: "délai et forme de la demande de remboursement",
  refundProcedure: "moyen de remboursement, délai de versement et traitement des éventuels frais de paiement",
  absenceProof: "forme et délai de transmission du justificatif d'absence",
  publicationRules: "publications prises en compte, comptes concernés, durée de l'obligation et conséquence des jours manqués",
  exerciseDeadlines: "délais de remise des exercices et tolérance",
  attendanceProof: "mode d'établissement de la présence",
  officialContacts: "coordonnées officielles de réclamation",
  proofsRetention: "durée de conservation des preuves",
  incompleteClaim: "traitement d'une demande de remboursement incomplète",
  supportRequest: "demande et date de début de l'accompagnement individuel",
  competenceAssessment: "présentation de la grille, personne qui évalue, moment de l'évaluation et communication du résultat",
  progressScope: "plateformes prises en compte pour la progression",
  progressPeriods: "dates des relevés et périodes comparées",
  progressThreshold: "seuil de progression",
  zeroBaselineMinimum: "minimum en nombre pour un indicateur parti de zéro (ex. nombre d'abonnés ou de vues)",
  refundDelay: "délai de versement du remboursement",
};

export const guaranteeContract = {
  title: `Conditions et modalités de la garantie ${GUARANTEE_DAYS} jours — Contenu & Performance`,
  pendingDecisions: {
    // Décidé le 25/10/2026, précisé le 29/10/2026.
    attendance:
      "La présence est requise à toutes les sessions en direct. Une absence n'empêche pas le participant de continuer à suivre la formation. Seules les absences non justifiées sont décomptées : une première absence non justifiée est sans conséquence ; la deuxième entraîne automatiquement la perte du droit au remboursement prévu par la garantie. Un replay de chaque session est fourni ; son visionnage ne vaut pas présence.",
    // Décidé le 26/10/2026.
    absenceJustification: "Sont considérées comme justifiées les absences pour maladie ou urgence.",
    // Décidé le 25/10/2026.
    catchUp:
      "Le rattrapage concerne uniquement les sessions manquées du fait du formateur. Une session manquée par le participant ne donne pas lieu à rattrapage.",
    // Décidé le 26/10/2026.
    productInformation:
      "Les informations sur les produits présentés relèvent de la responsabilité de chaque participant.",
    // Décidé le 25/10/2026.
    dailyPublication: "3 publications par jour sur chacune des plateformes utilisées par le participant.",
    // Décidé le 26/10/2026.
    publicationPeriod: "Dès la mise en place du calendrier éditorial du participant.",
    // Décidé le 25/10/2026.
    publicationSchedule:
      "Les heures de publication sont personnalisables : chaque participant fixe ses propres heures dans son calendrier éditorial.",
    // Décidé le 26/10/2026.
    exercises: "Les exercices sont obligatoires, sans exception, y compris en cas d'absence à une session en ligne.",
    // Décidé le 29/10/2026.
    proofs:
      "captures d'écran datées ou liens des publications ; statistiques des comptes retenus au relevé de départ et au relevé de fin (captures datées des statistiques natives des plateformes, faisant apparaître la période sélectionnée) ; exercices réalisés et transmis ; preuves de présence.",
    // Décidé le 26/10/2026.
    individualSupport: "Le suivi individuel se fait sur WhatsApp.",
    // Décidé le 26/10/2026, précisé le 29/10/2026 (critères alternatifs).
    evaluation:
      "Le participant obtient un résultat positif dès que l'une au moins des conditions suivantes est remplie (critères alternatifs, non cumulatifs) : l'acquisition des compétences visées, ou une progression mesurable d'au moins un indicateur parmi le nombre de vues, d'abonnés et de mentions « J'aime ». Les ventes et le chiffre d'affaires ne sont pas des critères de résultat : vendre immédiatement n'est pas le résultat attendu, mais une vente réalisée peut être notée comme un résultat d'évolution.",
    // Décidé le 29/10/2026.
    claimDeadline:
      "La demande de remboursement est adressée par WhatsApp ou par e-mail dans un délai de quatorze (14) jours calendaires à compter de la fin effective des trente (30) jours d'accompagnement individuel.",
    // Décidé le 26/10/2026.
    refundProcedure:
      "Remboursement par PayPal ou par transfert via un établissement spécialisé (service de transfert d'argent).",
    // Décisions du 29/10/2026.
    absenceProof:
      "Le justificatif est transmis dans les 2 jours suivant l'absence. Il peut être donné oralement ; lorsqu'il est invoqué à l'appui d'une demande de remboursement, il doit être fourni sous forme de fichier numérique (PDF, image ou vidéo).",
    publicationRules:
      "Seules les publications originales sont prises en compte : les stories et les republications ne comptent pas. L'obligation s'applique à tous les comptes du participant, pendant la formation, pendant le délai de 14 jours qui la suit et pendant l'accompagnement individuel. Deux jours au total sans les publications requises entraînent la perte du droit au remboursement prévu par la garantie.",
    exerciseDeadlines: "Chaque exercice est remis dans le délai fixé par le formateur, avec une tolérance de 3 jours.",
    attendanceProof:
      "La présence est établie par les deux parties : registre de présence tenu par le formateur et éléments fournis par le participant.",
    officialContacts: `e-mail : ${offer.seller.email} ; WhatsApp : ${offer.seller.whatsapp}`,
    proofsRetention:
      "Les preuves sont conservées jusqu'à l'expiration du délai pendant lequel une action liée au contrat peut être engagée.",
    incompleteClaim: "Une demande de remboursement incomplète est refusée.",
    supportRequest:
      "Le participant demande l'accompagnement dans les 14 jours suivant la fin de la formation et continue, pendant ces 14 jours, à publier chaque jour. L'accompagnement individuel de 30 jours commence à l'issue de ce délai de 14 jours, qui n'est pas compté dans la durée de la garantie.",
    competenceAssessment:
      "La grille d'évaluation est présentée pendant la formation. L'évaluation est réalisée par le formateur, Tchanko Chirac, à la fin de la formation puis, le cas échéant, à la fin de l'accompagnement individuel ; son résultat est communiqué par écrit au participant dans les 3 jours suivant l'évaluation.",
    progressScope: "Au moins deux plateformes, choisies par le participant au début de la formation.",
    progressPeriods:
      "Relevé de départ au début de la formation ; relevés de fin à la fin de la formation puis, le cas échéant, à la fin de l'accompagnement individuel. Les vues et les mentions « J'aime » sont comparées sur deux périodes de 28 jours, l'une précédant le relevé de départ, l'autre précédant le relevé de fin ; les abonnés sont comparés en nombre total à chaque date de relevé.",
    progressThreshold: "Une hausse d'au moins 10 % d'au moins un indicateur, sur au moins une des plateformes retenues.",
    // Décidé le 29/10/2026.
    zeroBaselineMinimum:
      "Pour un indicateur parti de zéro, la progression est atteinte à partir de 50 abonnés pour les abonnés et de 500 vues pour les vues.",
    refundDelay: "Le remboursement est versé dans un délai de 7 jours, sans aucune déduction.",
  } satisfies GuaranteeDecisions as GuaranteeDecisions,
  /** true seulement quand toutes les décisions ci-dessus sont prises et reprises dans les CGV. */
  termsFinalized: false,
  /** true seulement après relecture par un professionnel du droit. N'est jamais affiché sur le site. */
  legalReviewDone: false,
};

/** Décisions encore manquantes (affichées « À COMPLÉTER » dans les CGV). */
export function missingGuaranteeDecisions(): (keyof GuaranteeDecisions)[] {
  const decisions = guaranteeContract.pendingDecisions;
  return (Object.keys(decisions) as (keyof GuaranteeDecisions)[]).filter((key) => !decisions[key]?.trim());
}
