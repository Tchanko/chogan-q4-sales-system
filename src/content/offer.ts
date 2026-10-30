/**
 * Contenu commercial de l'offre — source unique de vérité.
 *
 * Toute information affichée sur le site (prix, dates, programme, bonus, FAQ)
 * vient de ce fichier. Les champs marqués « À CONFIRMER » doivent être validés
 * avant la mise en ligne (voir docs/CHECKLIST-MISE-EN-LIGNE.md).
 *
 * Règles éditoriales :
 * - aucun chiffre de ventes, de vues ou de prospects n'est promis ;
 * - un bonus n'est marqué « disponible » que lorsque son fichier existe ;
 * - la garantie (src/content/guarantee.ts) : résultat positif = compétences acquises
 *   OU progression mesurable des vues, abonnés ou « J'aime » ; ventes et chiffre
 *   d'affaires exclus des critères.
 */

export const offer = {
  name: "CHOGAN Q4 SALES SYSTEM",
  shortName: "Q4 Sales System",
  tagline:
    "Construis en 30 jours un système pratique de création de contenu et de prospection pour présenter les produits Chogan plus professionnellement.",
  promise:
    "Apprendre à construire en 30 jours un système pratique de création de contenu et de prospection pour présenter les produits Chogan plus professionnellement et développer ta présence sur les réseaux sociaux.",

  price: {
    amountCents: 29700,
    currency: "EUR" as const,
    label: "297 €",
    /** À CONFIRMER : mention TVA selon le statut du vendeur (affichée dans les CGV). */
    vatNote: "Prix sans TVA (prestataire établi au Cameroun).",
  },

  /** Vendeur et éditeur du site (informations fournies le 26/10/2026). */
  seller: {
    name: "Tchanko Chirac",
    status: "freelance",
    address: "PK14, Douala – Cameroun",
    registration: "P06951842290Y",
    email: "tchankochirac@gmail.com",
    /** WhatsApp officiel (réclamations et contact), communiqué le 29/10/2026. */
    whatsapp: "+237 6 53 06 82 65",
  },

  /** Budget publicitaire demandé à chaque participant (non inclus dans le prix). */
  adBudget: { label: "200 €" },

  /** Rythme et format, identiques pour les deux sessions. */
  schedule: {
    rhythm: "4 sessions par semaine",
    format: "100 % pratique",
  },

  /**
   * Sessions (promotions) proposées — décisions du vendeur du 30/10/2026 :
   * - 10 participants maximum par session, comptés sur les inscriptions confirmées
   *   (paiement ou réservation effectivement vérifiés) ;
   * - les inscriptions d'une session ferment dès 10 inscriptions confirmées, ou au plus
   *   tard 3 jours après son démarrage, à 23 h 59 (heure de Paris) ;
   * - la Session 2 n'ouvre qu'une fois la Session 1 fermée ; il n'y a pas de Session 3 ;
   * - la Session 2 se réserve avec 50 € déduits du prix (conditions dans les CGV).
   * Hypothèse à confirmer : fin de la Session 2 le 8 janvier 2027, mêmes jours et horaires.
   * Si la capacité change, modifier aussi le déclencheur SQL de supabase/migrations.
   */
  cohorts: [
    {
      id: "2026-11",
      name: "Session 1",
      startLabel: "6 novembre 2026",
      endLabel: "6 décembre 2026",
      shortDates: "6 nov. → 6 déc. 2026",
      capacity: 10,
      /** Démarrage + 3 jours, 23 h 59 (heure de Paris). Remplaçable par ENROLLMENT_DEADLINE. */
      enrollmentDeadlineIso: "2026-11-09T23:59:59+01:00",
      deposit: null,
    },
    {
      id: "2026-12",
      name: "Session 2",
      startLabel: "8 décembre 2026",
      endLabel: "8 janvier 2027",
      shortDates: "8 déc. 2026 → 8 janv. 2027",
      capacity: 10,
      /** Démarrage + 3 jours, 23 h 59 (heure de Paris). */
      enrollmentDeadlineIso: "2026-12-11T23:59:59+01:00",
      /** Réservation de place, déduite du prix (Session 2 uniquement). */
      deposit: { amountCents: 5000, label: "50 €" },
    },
  ],

  audience:
    "Consultants et consultantes Chogan qui veulent développer leur activité grâce aux réseaux sociaux, mais qui manquent de temps, d'idées ou de compétences pour créer du contenu professionnel.",

  problems: [
    {
      title: "Tu ne sais pas quoi publier",
      text: "Tu ouvres Instagram ou TikTok, tu n'as pas d'idée, et la publication du jour passe à la trappe.",
    },
    {
      title: "Tes visuels et vidéos manquent d'impact",
      text: "Tu publies, mais tes contenus ressemblent à ceux de tout le monde et n'arrêtent pas le défilement.",
    },
    {
      title: "Tu publies sans attirer assez de prospects",
      text: "Les likes arrivent parfois, les conversations et les demandes d'information beaucoup moins.",
    },
    {
      title: "Tu ne sais pas utiliser l'IA pour créer",
      text: "Tu entends parler d'IA partout, mais tu ne sais pas comment t'en servir concrètement pour tes contenus.",
    },
    {
      title: "Facebook Ads te paraît trop technique",
      text: "Tu ne sais pas par où commencer pour structurer une première campagne publicitaire.",
    },
  ],

  method: {
    title: "La méthode Q4 en trois étapes",
    intro:
      "Le programme suit l'ordre dans lequel un consultant construit réellement sa présence : d'abord un plan, ensuite des contenus, enfin la diffusion et la prospection.",
    pillars: [
      {
        name: "Planifier",
        text: "Une stratégie de contenu claire et un calendrier éditorial pour savoir chaque jour quoi publier.",
      },
      {
        name: "Produire",
        text: "Des contenus plus professionnels avec l'IA : visuels, vidéos courtes, scripts et voix off, montés avec CapCut.",
      },
      {
        name: "Diffuser et prospecter",
        text: "Des profils optimisés, une page Facebook professionnelle, une première campagne Facebook Ads et un plan d'action pour le Q4.",
      },
    ],
  },

  learningOutcomes: [
    "Construire ton calendrier éditorial sur 30 jours.",
    "Créer des publications adaptées à Instagram et à TikTok.",
    "Produire des vidéos courtes avec l'IA : format UGC, Shorts et vidéos sans visage.",
    "Monter tes vidéos avec CapCut.",
    "Écrire des scripts publicitaires et enregistrer des voix off.",
    "Optimiser tes profils et créer une page Facebook professionnelle.",
    "Structurer et lancer une première campagne Facebook Ads.",
    "Bâtir ton plan d'action commercial pour le Q4 et le Black Friday.",
  ],

  modules: [
    {
      title: "Stratégie de contenu et calendrier éditorial",
      text: "Définir tes thèmes, tes formats et ton rythme, puis organiser un mois de publications.",
    },
    {
      title: "Création de contenu pour Instagram et TikTok",
      text: "Adapter tes idées aux codes de chaque plateforme : accroches, formats, légendes.",
    },
    {
      title: "Création de vidéos IA : UGC, Shorts et vidéos sans visage",
      text: "Utiliser des outils d'IA pour produire des vidéos courtes, même sans te montrer à l'écran.",
    },
    {
      title: "Montage vidéo avec CapCut",
      text: "Couper, rythmer, sous-titrer et exporter des vidéos propres depuis ton téléphone ou ton ordinateur.",
    },
    {
      title: "Voix off et scripts publicitaires",
      text: "Écrire des scripts qui présentent un produit clairement et enregistrer une voix off.",
    },
    {
      title: "Optimisation des profils et page Facebook professionnelle",
      text: "Rendre tes profils lisibles et crédibles, et créer une page Facebook dédiée à ton activité.",
    },
    {
      title: "Initiation pratique à Facebook Ads",
      text: "Comprendre la structure d'une campagne et préparer ta première publicité, étape par étape.",
    },
    {
      title: "Plan d'action commercial pour le Q4 et le Black Friday",
      text: "Assembler tout ce que tu as construit dans un plan concret pour la fin d'année.",
    },
  ],

  /**
   * Bonus prévus. Passer `available` à true uniquement quand le fichier
   * correspondant existe et peut être remis aux participants.
   * `value` : valeur affichée en euros, fixée par le vendeur (24/10/2026). Elle doit
   * correspondre à un prix réellement pratiqué ou justifiable (prix de référence).
   */
  bonuses: [
    { title: "Calendrier éditorial Chogan sur 30 jours", value: 47, available: false },
    { title: "Bibliothèque de prompts IA", value: 37, available: false },
    { title: "Pack de scripts vidéo", value: 37, available: false },
    { title: "Checklist de lancement Facebook Ads", value: 27, available: false },
    { title: "Tableau de suivi des prospects", value: 27, available: false },
  ],

  sessions: {
    facts: [
      "Session 1 : du 6 novembre au 6 décembre 2026.",
      "Session 2 : du 8 décembre 2026 au 8 janvier 2027, dès que la Session 1 est complète ou close.",
      "10 participants maximum par session.",
      "4 sessions par semaine.",
      "100 % pratique : chaque session aboutit à un livrable concret pour ton activité.",
    ],
    /** Modalités pratiques (reprises dans les CGV). */
    practical: {
      mode: "en ligne, en direct",
      tool: "Google Meet",
      days: "le lundi, le mercredi, le vendredi et le dimanche",
      duration: "2 heures",
      startTimes: "20 h ou 21 h (heure de Paris)",
      replays: true,
    },
    pendingDetails:
      "Les horaires, la durée des sessions et le lien d'accès sont communiqués aux participants dont l'inscription est confirmée.",
  },

  /**
   * Moyens de paiement acceptés (confirmés par le vendeur le 25/10/2026).
   * Même prix pour tous : aucun supplément selon le moyen de paiement.
   */
  paymentMethods: [
    {
      id: "virement",
      label: "Virement bancaire",
      help: "Les coordonnées te sont transmises sur WhatsApp après validation de ta demande.",
    },
    {
      id: "paypal",
      label: "PayPal",
      help: "Les informations de paiement PayPal te sont transmises sur WhatsApp après validation de ta demande.",
    },
    {
      id: "mobile_money",
      label: "Mobile Money",
      help: "Le numéro de paiement t'est transmis sur WhatsApp après validation de ta demande.",
    },
  ],

  leadMagnet: {
    title: "Mini-atelier : crée ton premier contenu Chogan avec l'IA",
    description:
      "Une démonstration gratuite, pas à pas : trouver une idée de publication, rédiger le texte avec l'IA et le transformer en visuel ou en script de vidéo courte.",
    points: [
      "Trouver un angle de publication pour un produit",
      "Rédiger le texte avec un assistant IA",
      "Transformer l'idée en visuel ou en script vidéo",
    ],
    /** Session en direct où la démonstration est présentée (heure de Paris = UTC+1 le 01/11/2026). */
    masterclass: {
      dateLabel: "1er novembre 2026 à 20 h (heure de Paris)",
      startsAtIso: "2026-11-01T20:00:00+01:00",
      ctaLabel: "Masterclass de lancement le 1er novembre 2026 à 20 h (heure de Paris)",
    },
  },

  faq: [
    {
      q: "À qui s'adresse la formation ?",
      a: "Aux consultants et consultantes Chogan qui veulent utiliser les réseaux sociaux pour développer leur activité, et qui manquent de temps, d'idées ou de compétences pour créer du contenu professionnel.",
    },
    {
      q: "Faut-il déjà savoir utiliser l'IA, CapCut ou Facebook Ads ?",
      a: "Le programme est pensé pour des consultants qui manquent justement de ces compétences. Si tu as un doute sur ton niveau ou ton matériel, pose ta question sur WhatsApp avant de t'inscrire.",
    },
    {
      q: "Quand se déroule la formation ?",
      a: "En deux sessions : la Session 1 du 6 novembre au 6 décembre 2026, puis la Session 2 du 8 décembre 2026 au 8 janvier 2027, à raison de 4 sessions par semaine. Les horaires et le lien d'accès sont communiqués aux participants dont l'inscription est confirmée.",
    },
    {
      q: "Combien de places y a-t-il ?",
      a: "10 places par session. Une place est attribuée uniquement à une inscription confirmée, c'est-à-dire après vérification du paiement : le nombre de places restantes affiché sur le site est calculé à partir de ces inscriptions. Les inscriptions à la Session 1 ferment dès que les 10 places sont prises, ou au plus tard le 9 novembre 2026 à 23 h 59 (heure de Paris). Il n'y aura pas de troisième session.",
    },
    {
      q: "Comment s'inscrire à la Session 2 ?",
      a: "Les inscriptions à la Session 2 ouvrent dès que la Session 1 est complète ou close. Tu réserves ta place en réglant 50 €, déduits du prix de 297 € : il reste ensuite 247 € à régler. La réservation n'est pas remboursable si tu décides de ne pas commencer la formation ; si tu la suis jusqu'au bout, elle est remboursable avec le reste du prix dans le cadre de la garantie 60 jours. Ton droit de rétractation reste applicable dans les conditions prévues par les conditions de vente.",
    },
    {
      q: "Puis-je m'inscrire après le démarrage d'une session ?",
      a: "Oui, jusqu'à 3 jours après le démarrage, s'il reste des places. Les sessions qui ont eu lieu avant la confirmation de ton inscription ne comptent pas comme des absences, tu reçois leurs replays, et ta progression est mesurée à partir de la date de confirmation de ton inscription.",
    },
    {
      q: "Comment se passe l'inscription et le paiement ?",
      a: "Tu envoies une demande d'inscription sur ce site. Tu reçois ensuite les instructions de paiement sur WhatsApp (pour la Session 2, d'abord la réservation de 50 €). Ton inscription est confirmée uniquement après vérification effective de ton paiement. Aucun paiement n'est demandé directement sur ce site pour le moment.",
    },
    {
      q: "Est-ce que je vais forcément faire plus de ventes ?",
      a: "Non, et personne ne peut te le garantir. La formation t'apprend une méthode et des outils pour créer du contenu et prospecter de façon plus structurée. Tes résultats dépendent de ton travail, de ton marché et de nombreux autres facteurs.",
    },
    {
      q: "Le budget publicitaire et les outils sont-ils inclus ?",
      a: "Non. Le budget de tes campagnes Facebook Ads reste à ta charge et n'est pas inclus dans le prix. Certains outils d'IA ou de montage proposent des versions gratuites et des options payantes : la liste des outils utilisés est communiquée aux participants.",
    },
    {
      q: "Cette formation est-elle proposée par Chogan ?",
      a: "Non. Il s'agit d'une formation indépendante, qui n'est ni éditée, ni approuvée, ni sponsorisée par la société Chogan. Tu restes responsable du respect des règles de communication fixées par Chogan pour ses consultants.",
    },
    {
      q: "Puis-je arrêter de recevoir des messages ?",
      a: "Oui, à tout moment : réponds « STOP » sur WhatsApp ou utilise la page de désinscription accessible en bas de chaque page.",
    },
  ],

  legal: {
    /** Versions des textes de consentement (conservées avec chaque enregistrement). */
    leadConsentVersion: "lead-2026-10-v1",
    termsVersion: "cgv-2026-10-v4",
    /**
     * Demande expresse d'exécution avant la fin du délai de rétractation
     * (consommateurs UE). À FAIRE VALIDER par un professionnel du droit.
     */
    requireEarlyStartConsent: true,
    disclaimer:
      "Formation indépendante, non affiliée à la société Chogan. « Chogan » est une marque appartenant à son titulaire et n'est citée que pour désigner le public visé.",
  },
} as const;

export type Offer = typeof offer;
export type PaymentMethodId = (typeof offer.paymentMethods)[number]["id"];

export const PAYMENT_METHOD_IDS = offer.paymentMethods.map((m) => m.id) as [
  PaymentMethodId,
  ...PaymentMethodId[],
];

export function paymentMethodLabel(id: string): string {
  return offer.paymentMethods.find((m) => m.id === id)?.label ?? id;
}

export type Cohort = (typeof offer.cohorts)[number];
export type CohortId = Cohort["id"];

export const COHORT_IDS = offer.cohorts.map((c) => c.id) as [CohortId, ...CohortId[]];

export function findCohort(id: string | null | undefined): Cohort | undefined {
  return offer.cohorts.find((c) => c.id === id);
}

/** Nom lisible d'une session, ex. « Session 2 (8 déc. 2026 → 8 janv. 2027) ». */
export function cohortLabel(id: string): string {
  const cohort = findCohort(id);
  return cohort ? `${cohort.name} (${cohort.shortDates})` : id;
}

/** Montant en euros lisible, ex. 24700 → « 247 € ». */
export function formatEuroCents(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-FR")} €`;
}

/** Solde restant après la réservation (Session 2), en centimes ; null sans réservation. */
export function balanceCents(cohort: Cohort): number | null {
  return cohort.deposit ? offer.price.amountCents - cohort.deposit.amountCents : null;
}

/** Textes de consentement affichés à côté des cases à cocher. */
export const consentTexts = {
  lead: "J'accepte que mes coordonnées soient utilisées pour recevoir le mini-atelier gratuit et être contacté(e), par WhatsApp ou e-mail, au sujet de la formation CHOGAN Q4 SALES SYSTEM. Je peux me désinscrire à tout moment.",
  terms: "J'ai lu et j'accepte les conditions de vente.",
  earlyStart: (startLabel: string) =>
    `Je demande que la formation commence le ${startLabel}, avant la fin de mon délai de rétractation de 14 jours. Je reconnais qu'en cas de rétractation le montant correspondant aux sessions déjà suivies restera dû, et que je perdrai ce droit une fois la formation entièrement exécutée.`,
  deposit: (depositLabel: string, balanceLabel: string) =>
    `Je réserve ma place avec ${depositLabel}, déduits du prix de 297 € (solde : ${balanceLabel}). J'ai compris que cette réservation n'est pas remboursable si je décide de ne pas commencer la formation, et qu'elle est remboursable avec le reste du prix si je suis la formation jusqu'au bout, dans les conditions de la garantie 60 jours.`,
  marketing:
    "J'accepte de recevoir d'autres conseils et offres par WhatsApp ou e-mail (facultatif).",
} as const;
