import { expect, test } from "./fixtures";

test.use({ freshVisitor: true });

const viewItemCount = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const dl = (window as unknown as { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? [];
    return Array.from(dl).filter((a) => a[0] === "event" && a[1] === "view_item").length;
  });

test.describe("Consentement et suivi", () => {
  test("refus : aucun outil de mesure n'est chargé", async ({ page, externalRequests }) => {
    await page.goto("/formation");
    const banner = page.getByRole("region", { name: "Ta vie privée, ton choix" });
    await expect(banner).toBeVisible();
    await banner.getByRole("button", { name: "Tout refuser" }).click();
    await expect(banner).toHaveCount(0);
    await page.reload();
    await page.waitForTimeout(800);
    await expect(page.getByRole("region", { name: "Ta vie privée, ton choix" })).toHaveCount(0);
    expect(externalRequests.filter((u) => u.includes("googletagmanager"))).toEqual([]);
  });

  test("accord : GA4 chargé et événement de vue envoyé une seule fois", async ({ page, externalRequests }) => {
    await page.goto("/formation");
    await page.getByRole("button", { name: "Tout accepter" }).click();
    await expect
      .poll(() => externalRequests.some((u) => u.includes("googletagmanager.com/gtag/js?id=G-TEST000000")))
      .toBe(true);
    await expect.poll(() => viewItemCount(page)).toBe(1);

    // Même session : la page rechargée ne renvoie pas l'événement.
    await page.reload();
    await page.waitForTimeout(1000);
    expect(await viewItemCount(page)).toBe(0);
  });

  test("les choix restent modifiables depuis le pied de page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Tout refuser" }).click();
    await page.getByRole("button", { name: "Gérer les cookies" }).click();
    const dialog = page.getByRole("dialog", { name: "Préférences de cookies" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel(/Mesure d'audience/)).not.toBeChecked();
    await dialog.getByRole("button", { name: "Annuler" }).click();
    await expect(dialog).toBeHidden();
  });
});
