import { readFile } from "node:fs/promises";
import path from "node:path";
import { E2E_DATA_DIR, E2E_WHATSAPP } from "./env";
import { expect, expectNoHorizontalScroll, test, waitHumanDelay } from "./fixtures";

const SUBMIT = "Masterclass de lancement le 30 octobre 2026 à 20 h (heure de Paris)";

test.describe("Page de capture (/)", () => {
  test("affiche le titre, le sous-titre et la ressource gratuite", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /^Tu es consultant Chogan, mais tu ne sais pas quoi publier pour attirer l'attention\s?\?$/,
    );
    await expect(
      page.getByText(
        "Découvre comment utiliser l'IA pour créer des contenus plus professionnels et structurer ta présence sur les réseaux sociaux.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Mini-atelier : crée ton premier contenu Chogan avec l'IA" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: SUBMIT })).toBeVisible();
    await expect(page.getByText("Pour les consultants et consultantes Chogan")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/conseill(?:er|ère)s?/i);
    await expectNoHorizontalScroll(page);
  });

  test("signale tous les champs manquants sans rien envoyer", async ({ page }) => {
    let posted = false;
    page.on("request", (r) => {
      if (r.url().includes("/api/leads")) posted = true;
    });
    await page.goto("/");
    await page.getByRole("button", { name: SUBMIT }).click();
    await expect(page.getByText("Indique ton prénom (2 caractères minimum).")).toBeVisible();
    await expect(page.getByText("Indique ton numéro WhatsApp.")).toBeVisible();
    await expect(page.getByText("Choisis ta difficulté principale.")).toBeVisible();
    await expect(page.getByText("Coche la case de consentement pour recevoir la démonstration.")).toBeVisible();
    await expect(page.getByLabel("Prénom")).toBeFocused();
    expect(posted).toBe(false);
  });

  test("enregistre le prospect, puis propose WhatsApp sans donnée personnelle dans le lien", async ({
    page,
  }, testInfo) => {
    const phone = testInfo.project.name === "mobile" ? "07 07 00 00 02" : "07 07 00 00 01";
    await page.goto("/?utm_source=facebook&utm_campaign=e2e-capture");
    await page.getByLabel("Prénom").fill("Awa");
    await page.getByLabel("Indicatif du pays").selectOption("CI");
    await page.getByLabel("Numéro de téléphone").fill(phone);
    await page.getByLabel("Ta difficulté principale").selectOption("ia");
    await page.getByLabel(/J'accepte que mes coordonnées soient utilisées/).check();
    await waitHumanDelay(page);

    const response = page.waitForResponse((r) => r.url().endsWith("/api/leads"));
    await page.getByRole("button", { name: SUBMIT }).click();
    expect((await response).status()).toBe(201);

    await expect(page.getByRole("heading", { name: "C'est noté, Awa !" })).toBeVisible();
    await expect(page.getByTestId("lead-success")).toContainText(
      "Ta place pour la masterclass de lancement du 30 octobre 2026 à 20 h (heure de Paris) est bien enregistrée.",
    );
    const whatsapp = page.getByRole("link", { name: /Continuer sur WhatsApp/ });
    await expect(whatsapp).toHaveAttribute("href", new RegExp(`^https://wa\\.me/${E2E_WHATSAPP}\\?text=`));
    expect(await whatsapp.getAttribute("href")).not.toMatch(/Awa|0707/);

    // Le prospect est réellement enregistré, au format international, avec sa source.
    const db = JSON.parse(await readFile(path.resolve(E2E_DATA_DIR, "db.json"), "utf8"));
    const lead = db.leads.find((l: { whatsapp: string }) => l.whatsapp === `+225${phone.replace(/\s/g, "")}`);
    expect(lead).toMatchObject({ firstName: "Awa", challenge: "ia", status: "new" });
    expect(lead.attribution).toMatchObject({ utmSource: "facebook", utmCampaign: "e2e-capture", landingPath: "/" });
  });

  test("n'affiche aucune confirmation quand l'envoi est rejeté (champ piège rempli)", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Prénom").fill("Robot");
    await page.getByLabel("Numéro de téléphone").fill("06 12 34 56 78");
    await page.getByLabel("Ta difficulté principale").selectOption("temps");
    await page.getByLabel(/J'accepte que mes coordonnées soient utilisées/).check();
    await page.locator("#cq4-hp-field").fill("http://spam.example", { force: true });
    await waitHumanDelay(page);
    await page.getByRole("button", { name: SUBMIT }).click();
    await expect(page.locator("form").getByRole("alert")).toContainText("n'a pas pu être traitée");
    await expect(page.getByRole("heading", { name: /C'est noté/ })).toHaveCount(0);
  });
});
