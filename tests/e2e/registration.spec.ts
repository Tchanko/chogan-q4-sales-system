import type { Browser, Page } from "@playwright/test";
import { E2E_ADMIN_PASSWORD } from "./env";
import { expect, expectNoHorizontalScroll, test, waitHumanDelay } from "./fixtures";

/** Contexte navigateur séparé (ex. administrateur), cookies refusés d'avance. */
async function newVisitor(browser: Browser, baseURL: string | undefined) {
  const context = await browser.newContext({ baseURL, locale: "fr-FR" });
  await context.addInitScript(() => {
    window.localStorage.setItem(
      "cq4_consent",
      JSON.stringify({ version: 1, analytics: false, marketing: false, decidedAt: new Date().toISOString() }),
    );
  });
  return context;
}

async function fillRegistration(page: Page, phone: string) {
  await page.getByLabel("Nom et prénom").fill("Awa Koné");
  await page.getByLabel("Pays de résidence").selectOption("BE");
  await page.getByLabel("Numéro de téléphone").fill(phone);
  await page.getByLabel(/Mobile Money/).check();
  await page.getByLabel(/J'ai lu et j'accepte les/).check();
  await page.getByLabel(/Je demande que la formation commence le 6 novembre 2026/).check();
}

test.describe("Inscription, confirmation et vérification du paiement", () => {
  test("parcours complet : demande → attente → confirmation après vérification", async ({
    page,
    browser,
    baseURL,
  }, testInfo) => {
    // Scénario long (deux navigateurs, une dizaine d'étapes).
    test.setTimeout(150_000);
    const phone = testInfo.project.name === "mobile" ? "0470 00 00 02" : "0470 00 00 01";

    // 1. Le formulaire signale les consentements manquants.
    await page.goto("/inscription");
    await expect(page.getByRole("heading", { level: 1, name: "Demande d'inscription" })).toBeVisible();
    await expect(page.getByText("297 €").first()).toBeVisible();
    await page.getByRole("button", { name: "Envoyer ma demande d'inscription" }).click();
    await expect(page.getByText("Tu dois accepter les conditions de vente.")).toBeVisible();

    // 2. Demande valide → page de confirmation, statut « demande reçue ».
    await fillRegistration(page, phone);
    // L'indicatif a suivi le pays de résidence.
    await expect(page.getByLabel("Indicatif du pays")).toHaveValue("BE");
    await waitHumanDelay(page);
    await page.getByRole("button", { name: "Envoyer ma demande d'inscription" }).click();
    await expect(page).toHaveURL(/\/confirmation$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Demande d'inscription reçue");
    await expect(page.getByText(/n'est pas encore confirmée/)).toBeVisible();
    await expect(page.getByTestId("registration-status").getByText("Mobile Money")).toBeVisible();
    const reference = (await page.getByTestId("registration-reference").innerText()).trim();
    expect(reference).toMatch(/^CQ4-[A-Z0-9]{6}$/);
    await expect(page.getByRole("link", { name: /Envoyer ma référence sur WhatsApp/ })).toHaveAttribute(
      "href",
      new RegExp(encodeURIComponent(reference)),
    );

    // 3. L'administrateur se connecte.
    const adminContext = await newVisitor(browser, baseURL);
    const admin = await adminContext.newPage();
    await admin.goto("/admin");
    await expect(admin).toHaveURL(/\/admin\/connexion$/);
    await admin.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
    await admin.getByRole("button", { name: "Se connecter" }).click();
    await expect(admin.locator("form").getByRole("alert")).toContainText("Mot de passe incorrect.");
    await admin.getByLabel("Mot de passe").fill(E2E_ADMIN_PASSWORD);
    await admin.getByRole("button", { name: "Se connecter" }).click();
    await expect(admin.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
    await expectNoHorizontalScroll(admin);

    const row = admin.getByTestId(`registration-row-${reference}`);
    await expect(row).toContainText("Demande reçue");

    // 4. Passage en « paiement en attente de vérification ».
    await row.getByLabel(`Nouveau statut pour ${reference}`).selectOption("payment_pending");
    await row.getByRole("button", { name: "OK" }).click();
    await expect(row).toContainText("Paiement en attente de vérification");
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Paiement en attente de vérification");
    await expect(page.getByText(/n'est pas encore confirmée/)).toBeVisible();

    // 5. Confirmation refusée sans case cochée ou avec un numéro de carte.
    await row.getByText("Confirmer le paiement…").click();
    await row.getByLabel(/Référence de la transaction/).fill("MM-E2E-0001");
    await row.getByRole("button", { name: "Confirmer l'inscription" }).click();
    await expect(row).toContainText("Confirme avoir vérifié la réception effective du paiement.");
    await row.getByLabel(/Référence de la transaction/).fill("4111 1111 1111 1111");
    await row.getByLabel(/J'ai vérifié la réception effective du paiement/).check();
    await row.getByRole("button", { name: "Confirmer l'inscription" }).click();
    await expect(row).toContainText("ressemble à un numéro de carte");
    await expect(row).toContainText("Paiement en attente de vérification");

    // 6. Confirmation après vérification effective.
    await row.getByLabel(/Référence de la transaction/).fill("MM-E2E-0001");
    await row.getByLabel(/J'ai vérifié la réception effective du paiement/).check();
    await row.getByRole("button", { name: "Confirmer l'inscription" }).click();
    await expect(row).toContainText("Inscription confirmée");
    await expect(row).toContainText("MM-E2E-0001");

    // 7. Le participant voit désormais l'inscription confirmée.
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Inscription confirmée");
    await expect(page.getByText(/n'est pas encore confirmée/)).toHaveCount(0);

    // 8. Export CSV réservé à l'administration.
    const csv = await admin.request.get("/admin/export?type=registrations");
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    expect(await csv.text()).toContain(reference);

    await adminContext.close();
  });

  test("sans demande sur cet appareil, la confirmation ne prétend rien", async ({ page }) => {
    await page.goto("/confirmation");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Aucune demande d'inscription sur cet appareil",
    );
    await expect(page.getByText(/Inscription confirmée/)).toHaveCount(0);
  });

  test("un cookie de confirmation falsifié est ignoré", async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "cq4_reg", value: "eyJyaWQiOiJ4In0.faux", url: `${baseURL}/confirmation` },
    ]);
    await page.goto("/confirmation");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Aucune demande d'inscription sur cet appareil",
    );
  });
});
