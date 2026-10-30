import { E2E_PORT } from "./env";
import { expect, expectNoHorizontalScroll, test } from "./fixtures";

test.describe("Page de vente (/formation)", () => {
  test("présente toutes les sections, le prix et les dates", async ({ page }) => {
    await page.goto("/formation");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("30 jours");

    for (const title of [
      "Tu veux développer ton activité Chogan sur les réseaux, mais…",
      "La méthode Q4 en trois étapes",
      "À la fin des 30 jours, tu sauras…",
      "8 modules, du calendrier éditorial au plan d'action Q4",
      "Des ressources pour gagner du temps",
      "Un mois de pratique, au rythme de 4 sessions par semaine",
      "Ton inscription à la Session 1",
      "Tes questions, nos réponses",
    ]) {
      await expect(page.getByRole("heading", { name: title })).toBeAttached();
    }
    // Bande « Informations légales » retirée ; les liens légaux restent dans le pied de page.
    await expect(page.locator("main")).not.toContainText("Avant de t'inscrire, consulte les conditions de vente");
    // Pied de page : garantie « résultats ou remboursement », avec renvoi aux CGV.
    const footerGuarantee = page.getByTestId("footer-guarantee");
    await expect(footerGuarantee).toContainText("Garantie 60 jours : des résultats ou le remboursement intégral");
    await expect(footerGuarantee).not.toContainText("Les ventes et le chiffre d'affaires");
    await expect(footerGuarantee.getByRole("link", { name: "conditions générales de vente" })).toHaveAttribute(
      "href",
      "/conditions-de-vente#garantie",
    );
    await expect(page.locator("#programme ol > li")).toHaveCount(8);
    await expect(page.getByText("297 €").first()).toBeVisible();
    await expect(page.getByText(/Session 1 : du 6 novembre 2026 au 6 décembre 2026/).first()).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("le bouton principal mène à l'inscription", async ({ page }) => {
    await page.goto("/formation");
    const cta = page.getByRole("link", { name: "Je veux rejoindre CHOGAN Q4 SALES SYSTEM" });
    await expect(cta.first()).toHaveAttribute("href", "/inscription");
    await cta.first().click();
    await expect(page).toHaveURL(/\/inscription$/);
  });

  test("reste honnête : bonus en préparation, compteur réel, pas de fausse rareté", async ({ page }) => {
    await page.goto("/formation");
    await expect(page.getByText("En préparation", { exact: true })).toHaveCount(5);
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/plus que \d+ places?|compte à rebours|dernière chance|garanti(?:e|s)? de vendre/i);
    expect(text).toContain("Aucun paiement n'est demandé sur ce site.");
    // Compteur calculé à partir des inscriptions confirmées (10 places par session).
    const counters = page.getByTestId("seats-counter");
    await expect(counters.first()).toContainText(/^(\d+) places? restantes? sur 10/);
    await expect(counters.first()).toContainText("Calculé à partir des inscriptions confirmées");
    const remaining = Number(await counters.first().getAttribute("data-remaining"));
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(10);
    // Session 1 ouverte : pas de réservation ni de bandeau de fermeture.
    await expect(page.getByTestId("deposit-info")).toHaveCount(0);
    await expect(page.getByTestId("enrollment-banner")).toHaveCount(0);
  });

  test("FAQ : deux sessions, 10 places, réservation de la Session 2, inscription tardive", async ({ page }) => {
    await page.goto("/formation");
    const main = page.locator("main");
    await expect(main).toContainText("Session 2 : du 8 décembre 2026 au 8 janvier 2027");
    await expect(main).toContainText("10 participants maximum par session.");
    for (const q of [
      "Combien de places y a-t-il ?",
      "Comment s'inscrire à la Session 2 ?",
      "Puis-je m'inscrire après le démarrage d'une session ?",
    ]) {
      await expect(page.getByText(q, { exact: true })).toBeAttached();
    }
    await expect(main).toContainText("Tu réserves ta place en réglant 50 €, déduits du prix de 297 €");
    await expect(main).toContainText("ou au plus tard le 9 novembre 2026 à 23 h 59 (heure de Paris)");
    await expect(main).toContainText("Il n'y aura pas de troisième session.");
  });

  test("objectifs et bonus : textes retirés, valeur de chaque bonus affichée", async ({ page }) => {
    await page.goto("/formation");
    const main = page.locator("main");
    await expect(main).not.toContainText("Ces objectifs portent sur des compétences.");
    await expect(main).not.toContainText("Ces ressources sont en cours de préparation.");
    await expect(page.getByTestId("bonus-value")).toHaveText([
      /Valeur : 47 €\s*· offert/,
      /Valeur : 37 €\s*· offert/,
      /Valeur : 37 €\s*· offert/,
      /Valeur : 27 €\s*· offert/,
      /Valeur : 27 €\s*· offert/,
    ]);
    await expect(page.getByTestId("bonus-total")).toContainText("Valeur totale des bonus offerts gratuitement");
    await expect(page.getByTestId("bonus-total")).toContainText("175 €");
  });

  test("garantie 60 jours : placée avant le prix, principe clair, sans obligations détaillées", async ({ page }) => {
    await page.goto("/formation");
    const section = page.locator("#garantie");
    await expect(section.getByRole("heading", { level: 2, name: "Garantie 60 jours" })).toBeVisible();
    await expect(section).toContainText(
      "30 jours de mise en pratique, puis, si nécessaire, 30 jours d'accompagnement individuel supplémentaire, sans frais.",
    );
    await expect(section.getByTestId("guarantee-seal")).toContainText("297 € remboursés intégralement");
    await expect(section.getByTestId("guarantee-seal")).toContainText("Si tu n'obtiens pas de résultats.");
    await expect(section.getByTestId("guarantee-steps")).toContainText(
      "Tu suis la formation en direct, avec partage d'écran, et tu pratiques tes exercices, session après session.",
    );
    await expect(section.getByTestId("guarantee-steps")).toContainText(
      "tu peux solliciter le remboursement intégral de la formation.",
    );

    // Ordre : programme → bonus → … → garantie → prix.
    const top = async (name: string) =>
      (await page.getByRole("heading", { level: 2, name, exact: true }).boundingBox())!.y;
    const programme = await top("8 modules, du calendrier éditorial au plan d'action Q4");
    const bonus = await top("Des ressources pour gagner du temps");
    const garantie = await top("Garantie 60 jours");
    const prix = await top("Ton inscription à la Session 1");
    expect(programme).toBeLessThan(bonus);
    expect(bonus).toBeLessThan(garantie);
    expect(garantie).toBeLessThan(prix);

    await expect(section.getByTestId("guarantee-steps").locator("li")).toHaveCount(3);
    const deliverables = section.getByTestId("guarantee-deliverables").locator("li");
    await expect(deliverables).toHaveCount(5);
    await expect(deliverables.nth(1)).toContainText("8 visuels ou carrousels et 4 vidéos courtes");

    // Les obligations, exclusions et mentions provisoires restent dans les CGV.
    for (const removed of [
      "Respecter les conditions de présence",
      "Réaliser les exercices",
      "Fournir les informations nécessaires",
      "Elle ne garantit ni ventes",
      "en cours de finalisation",
      "Lire les conditions de la garantie",
      "si les critères de la garantie sont remplis",
      "Garantie soumise aux critères et modalités",
      "Consulter les conditions générales de vente",
    ]) {
      await expect(section).not.toContainText(removed);
    }
    await expect(section).not.toContainText(/juridiquement validée|validée par un avocat|\d+ ?%/i);
    await expectNoHorizontalScroll(page);
  });

  test("garantie : le CTA mène à l'inscription ; les modalités sont dans les CGV", async ({ page }) => {
    await page.goto("/formation");
    const section = page.locator("#garantie");
    const cta = section.getByRole("link", { name: "Je veux rejoindre CHOGAN Q4 SALES SYSTEM" });
    await expect(cta).toHaveAttribute("href", "/inscription");
    await expect(section.getByRole("link")).toHaveCount(1);

    await page.goto("/conditions-de-vente#garantie");
    await expect(page.getByText("La garantie 60 jours est soumise aux critères et modalités prévus au présent article.")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "7. Conditions et modalités de la garantie 60 jours — Contenu & Performance",
      }),
    ).toBeInViewport();
    for (const sub of [
      "7.1 Objet et principe",
      "7.2 Critères de participation",
      "7.3 Publication quotidienne à des heures planifiées",
      "7.4 Exercices et travaux",
      "7.5 Preuves requises",
      "7.6 Suivi individuel",
      "7.7 Critères pédagogiques d'évaluation",
      "7.8 Délais de réclamation",
      "7.9 Procédure de remboursement",
      "7.10 Portée de la garantie",
    ]) {
      await expect(page.getByRole("heading", { level: 3, name: sub })).toBeAttached();
    }
    // Les 11 décisions encore ouvertes sont signalées « À COMPLÉTER », jamais présentées comme validées.
    const pending = await page.evaluate(() => {
      let count = 0;
      for (let el = document.getElementById("garantie")?.nextElementSibling; el && el.tagName !== "H2"; el = el.nextElementSibling) {
        count += [...el.querySelectorAll("mark")].filter((m) => m.textContent?.includes("À COMPLÉTER")).length;
      }
      return count;
    });
    // Toutes les décisions de la garantie sont prises : plus aucun « À COMPLÉTER » à l'article 7.
    expect(pending).toBe(0);
  });

  test("CGV : vendeur, modalités, prix, paiement et rétractation à jour", async ({ page }) => {
    await page.goto("/conditions-de-vente");
    const main = page.locator("main");
    await expect(main).toContainText("vendue par Tchanko Chirac");
    await expect(main).toContainText("Session 1 : du 6 novembre 2026 au 6 décembre 2026");
    await expect(main).toContainText("Session 2 : du 8 décembre 2026 au 8 janvier 2027");
    await expect(main).toContainText(
      "formation en ligne, en direct, via Google Meet ; sessions le lundi, le mercredi, le vendredi et le dimanche, d'une durée de 2 heures chacune.",
    );
    await expect(main).toContainText("leurs replays sont mis à disposition des participants");
    await expect(main).toContainText("Les bonus sont remis au fur et à mesure de leur utilisation pendant la formation.");
    await expect(main).toContainText("297 €, identique quel que soit le moyen de paiement");
    await expect(main).toContainText("Un budget publicitaire de 200 € par participant");
    await expect(main).toContainText("Moyens de paiement acceptés : Virement bancaire, PayPal, Mobile Money.");
    await expect(main).toContainText("dispose d'un délai de 14 jours");
    await expect(main).toContainText("montant proportionnel aux sessions déjà suivies");
    await expect(main).toContainText("la deuxième entraîne automatiquement la perte du droit au remboursement");
    await expect(main).toContainText("Le rattrapage concerne uniquement les sessions manquées du fait du formateur.");
    await expect(main).toContainText("3 publications par jour sur chacune des plateformes utilisées par le participant.");
    await expect(main).toContainText("chaque participant fixe ses propres heures");
    await expect(main).not.toContainText(/1er novembre|Autre moyen/);
  });

  test("CGV : places, clôture, réservation de la Session 2 et inscription tardive (30/10)", async ({ page }) => {
    await page.goto("/conditions-de-vente");
    const main = page.locator("main");
    await expect(main).toContainText("Version : cgv-2026-10-v4");
    await expect(main).toContainText("deux sessions (promotions) de 10 participants maximum chacune");
    await expect(main).toContainText("Aucune autre session n'est prévue.");
    await expect(main).toContainText("Une demande d'inscription ne réserve pas de place.");
    await expect(main).toContainText("le 9 novembre 2026 à 23:59 pour la Session 1, le 11 décembre 2026 à 23:59 pour la Session 2");
    await expect(main).toContainText("Toute somme déjà versée pour cette demande lui est intégralement remboursée.");
    await expect(main).toContainText("réservation de place de 50 €, déduite du prix : le solde restant à payer est de 247 €");
    await expect(main).toContainText(
      "Elle n'est pas remboursable si le participant décide de ne pas débuter la formation. Elle est remboursable si le participant suit la formation jusqu'au bout",
    );
    await expect(main).toContainText("sans préjudice du droit de rétractation (article 5)");
    await expect(main).toContainText("ne sont pas décomptées comme des absences");
    await expect(main).toContainText("le relevé de départ prévu à l'article 7.7.3 est effectué à la date de confirmation de l'inscription");
    await expect(main).toContainText("pour une inscription confirmée après le démarrage, à la date de confirmation de l'inscription");
    // Échéance du solde non décidée : signalée, jamais inventée.
    await expect(main.locator("mark", { hasText: "date limite de paiement du solde de la Session 2" })).toHaveCount(1);
  });

  test("CGV : décisions du 26/10 (horaires, TVA, rétractation, report, garantie, droit applicable)", async ({
    page,
  }) => {
    await page.goto("/conditions-de-vente");
    const main = page.locator("main");
    await expect(main).toContainText("Les sessions commencent à 20 h ou 21 h (heure de Paris).");
    await expect(main).toContainText("Prix sans TVA (prestataire établi au Cameroun).");
    await expect(main.getByRole("link", { name: "tchankochirac@gmail.com" }).first()).toHaveAttribute(
      "href",
      "mailto:tchankochirac@gmail.com",
    );
    await expect(main).toContainText("Un formulaire type de rétractation lui est alors transmis par e-mail");
    await expect(main).toContainText("Le formateur peut reporter une session sans condition.");
    await expect(main).toContainText("Sont considérées comme justifiées les absences pour maladie ou urgence.");
    await expect(main).toContainText("Dès la mise en place du calendrier éditorial du participant.");
    await expect(main).toContainText("Les exercices sont obligatoires, sans exception");
    await expect(main).toContainText("Le suivi individuel se fait sur WhatsApp.");
    await expect(main).toContainText("Les ventes et le chiffre d'affaires ne sont pas des critères de résultat");
    await expect(main).toContainText(
      "dans un délai de quatorze (14) jours calendaires à compter de la fin effective des trente (30) jours d'accompagnement individuel",
    );
    await expect(main).toContainText("par PayPal ou par transfert via un établissement spécialisé");
    await expect(main).toContainText("Les présentes conditions sont soumises au droit camerounais.");
    await expect(main).toContainText("Acte uniforme OHADA relatif à la médiation");
  });

  test("mentions légales : identité de l'éditeur", async ({ page }) => {
    await page.goto("/mentions-legales");
    const main = page.locator("main");
    await expect(main).toContainText("édité par Tchanko Chirac, prestataire freelance établi au Cameroun");
    await expect(main).toContainText("Adresse : PK14, Douala – Cameroun");
    await expect(main).toContainText("Numéro d'immatriculation : P06951842290Y");
    await expect(main).toContainText("Directeur de la publication : Tchanko Chirac");
    await expect(main).toContainText("WhatsApp : +237 6 53 06 82 65");
    await expect(main).toContainText("Absence d'engagement sur des résultats chiffrés");
  });

  test("CGV : garantie précisée le 29/10 (preuves, évaluation, accompagnement, remboursement)", async ({ page }) => {
    await page.goto("/conditions-de-vente");
    const main = page.locator("main");
    await expect(main).toContainText("(critères alternatifs, non cumulatifs)");
    await expect(main).toContainText("Une hausse d'au moins 10 % d'au moins un indicateur");
    await expect(main).toContainText("comparées sur deux périodes de 28 jours");
    await expect(main).toContainText("L'accompagnement individuel de 30 jours commence à l'issue de ce délai de 14 jours");
    await expect(main).toContainText("communiqué par écrit au participant dans les 3 jours suivant l'évaluation");
    await expect(main).toContainText("les stories et les republications ne comptent pas");
    await expect(main).toContainText("avec une tolérance de 3 jours");
    await expect(main).toContainText("le participant masque les informations de tiers non nécessaires à la preuve");
    await expect(main).toContainText("e-mail : tchankochirac@gmail.com ; WhatsApp : +237 6 53 06 82 65");
    await expect(main).toContainText("Une demande de remboursement incomplète est refusée.");
    await expect(main).toContainText("à partir de 50 abonnés pour les abonnés et de 500 vues pour les vues");
    await expect(main).toContainText("Le remboursement est versé dans un délai de 7 jours, sans aucune déduction.");
    await expect(main).toContainText("7.11 Contenus et allégations produits");
    await expect(main).toContainText("8. Absence d'engagement sur des résultats chiffrés");
    await expect(main).not.toContainText("aucune absence n'est tolérée");
    await expect(main).not.toContainText("contenu qui vend");
  });

  test("FAQ dépliable au clavier", async ({ page }) => {
    await page.goto("/formation");
    const question = page.locator("summary", { hasText: "Cette formation est-elle proposée par Chogan ?" });
    await question.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText(/formation indépendante, qui n'est ni éditée, ni approuvée/)).toBeVisible();
  });

  test("métadonnées SEO et Open Graph", async ({ page }) => {
    await page.goto("/formation");
    await expect(page).toHaveTitle(/30 jours pour structurer ton contenu/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /30 jours/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `http://localhost:${E2E_PORT}/formation`,
    );
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute("content", /opengraph-image/);
    // Indexation désactivée tant que NEXT_PUBLIC_ALLOW_INDEXING n'est pas activé.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("barre d'inscription fixe sur mobile après le haut de page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Uniquement sur mobile");
    await page.goto("/formation");
    const sticky = page.getByRole("link", { name: "Rejoindre la formation" });
    await expect(sticky).not.toBeInViewport();
    await page.locator("#programme").scrollIntoViewIfNeeded();
    await expect(sticky).toBeInViewport();
  });
});
