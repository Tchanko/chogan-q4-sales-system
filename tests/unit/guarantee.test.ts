import { describe, expect, it } from "vitest";
import {
  GUARANTEE_DAYS,
  GUARANTEE_DECISION_LABELS,
  PRACTICE_DAYS,
  SUPPORT_DAYS,
  guaranteeContract,
  guaranteeDeliverables,
  guaranteeMarketing,
  missingGuaranteeDecisions,
} from "@/content/guarantee";
import { offer } from "@/content/offer";

const marketingTexts = [
  guaranteeMarketing.title,
  guaranteeMarketing.principle,
  guaranteeMarketing.refundCondition,
  ...guaranteeMarketing.steps.flatMap((s) => [s.period, s.title, s.text]),
  ...guaranteeDeliverables.flatMap((d) => [d.title, d.detail ?? ""]),
];

describe("garantie 60 jours", () => {
  it("additionne 30 jours de pratique et 30 jours d'accompagnement", () => {
    expect([PRACTICE_DAYS, SUPPORT_DAYS, GUARANTEE_DAYS]).toEqual([30, 30, 60]);
    expect(guaranteeMarketing.title).toBe("Garantie 60 jours");
    expect(guaranteeContract.title).toBe(
      "Conditions et modalités de la garantie 60 jours — Contenu & Performance",
    );
  });

  it("annonce un remboursement intégral égal au prix de la formation", () => {
    expect(offer.price.label).toBe("297 €");
    expect(guaranteeMarketing.refundCondition).toBe("Si tu n'obtiens pas de résultats.");
    expect(guaranteeMarketing.steps[2].title).toBe("Remboursement intégral de 297 €");
  });

  it("reprend les 3 étapes décidées par le vendeur", () => {
    expect(guaranteeMarketing.steps.map((s) => s.text)).toEqual([
      "Tu suis la formation en direct, avec partage d'écran, et tu pratiques tes exercices, session après session.",
      "Si, après avoir fait tes exercices, tu n'as obtenu aucun résultat au bout de 30 jours (compétences acquises ou progression de tes vues, abonnés ou « J'aime »), on t'accompagne en individuel pendant 30 jours supplémentaires, sans frais.",
      "Si, après avoir suivi cet accompagnement et mis en place le système vu pendant la formation, tu n'obtiens pas de résultat, tu peux solliciter le remboursement intégral de la formation.",
    ]);
  });

  it("couvre les 5 livrables convenus", () => {
    expect(guaranteeDeliverables.map((d) => d.title)).toEqual([
      "Un calendrier éditorial de 30 jours",
      "12 contenus finalisés",
      "Des hooks, scripts et appels à l'action",
      "Des profils sociaux optimisés",
      "Un plan d'action commercial et une préparation de campagne Facebook Ads",
    ]);
  });

  it("la communication n'annonce aucun chiffre et ne détaille pas les obligations", () => {
    for (const text of marketingTexts) {
      // Aucun volume promis (ventes, vues, prospects, abonnés, chiffre d'affaires).
      expect(text).not.toMatch(/\d[\d\s]*(ventes?|vues|prospects?|abonnés|€ de chiffre)/i);
      // Les obligations détaillées restent dans les CGV.
      expect(text).not.toMatch(/présence|preuves?|publication quotidienne|heures planifiées/i);
    }
  });

  it("ne déclare pas finalisées des décisions encore vides", () => {
    if (guaranteeContract.termsFinalized) expect(missingGuaranteeDecisions()).toEqual([]);
    if (guaranteeContract.legalReviewDone) expect(guaranteeContract.termsFinalized).toBe(true);
  });

  it("documente chaque décision à prendre", () => {
    expect(Object.keys(GUARANTEE_DECISION_LABELS).sort()).toEqual(
      Object.keys(guaranteeContract.pendingDecisions).sort(),
    );
  });
});

describe("bonus", () => {
  it("totalise 175 € de bonus offerts", () => {
    expect(offer.bonuses.reduce((sum, b) => sum + b.value, 0)).toBe(175);
  });

  it("affiche les valeurs fixées par le vendeur", () => {
    expect(offer.bonuses.map((b) => [b.title, b.value])).toEqual([
      ["Calendrier éditorial Chogan sur 30 jours", 47],
      ["Bibliothèque de prompts IA", 37],
      ["Pack de scripts vidéo", 37],
      ["Checklist de lancement Facebook Ads", 27],
      ["Tableau de suivi des prospects", 27],
    ]);
  });
});
