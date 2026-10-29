import AxeBuilder from "@axe-core/playwright";
import { E2E_PORT } from "./env";
import { expect, expectNoHorizontalScroll, test, waitHumanDelay } from "./fixtures";

const PUBLIC_PAGES = [
  "/",
  "/formation",
  "/inscription",
  "/confirmation",
  "/desinscription",
  "/mentions-legales",
  "/confidentialite",
  "/conditions-de-vente",
  "/admin/connexion",
];

test.describe("Accessibilité et affichage", () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} : aucune violation d'accessibilité grave, pas de défilement horizontal`, async ({ page }) => {
      await page.goto(path);
      await expectNoHorizontalScroll(page);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .exclude("#cq4-hp-field")
        .analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(
        serious.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`),
      ).toEqual([]);
    });
  }

  test("chaque page publique a un titre unique", async ({ page }) => {
    const titles = new Set<string>();
    for (const path of PUBLIC_PAGES.filter((p) => p !== "/admin/connexion")) {
      await page.goto(path);
      titles.add(await page.title());
    }
    expect(titles.size).toBe(PUBLIC_PAGES.length - 1);
  });

  test("le lien d'évitement mène au contenu", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Navigation clavier testée sur ordinateur");
    await page.goto("/formation");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Aller au contenu" })).toBeFocused();
  });
});

test.describe("Désinscription", () => {
  test("enregistre la demande", async ({ page }) => {
    await page.goto("/desinscription");
    await page.getByLabel("Adresse e-mail").fill("desinscription-e2e@example.com");
    await waitHumanDelay(page);
    await page.getByRole("button", { name: "Me désinscrire" }).click();
    await expect(page.getByTestId("unsubscribe-done")).toContainText("Ta demande de désinscription est enregistrée.");
  });
});

test.describe("Sécurité et fichiers techniques", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Indépendant de l'appareil");
  });

  test("en-têtes de sécurité", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("une requête provenant d'un autre site est refusée", async ({ request }) => {
    const res = await request.post("/api/leads", {
      headers: { origin: "https://site-malveillant.example", "content-type": "application/json" },
      data: { firstName: "X" },
    });
    expect(res.status()).toBe(403);
  });

  test("l'export et l'administration exigent une session", async ({ request }) => {
    const exportRes = await request.get("/admin/export?type=leads", { maxRedirects: 0 });
    expect(exportRes.status()).toBe(307);
    expect(exportRes.headers()["location"]).toContain("/admin/connexion");
    const adminRes = await request.get("/admin", { maxRedirects: 0 });
    expect(adminRes.status()).toBe(307);
  });

  test("le webhook de paiement ne confirme rien sans prestataire", async ({ request }) => {
    const res = await request.post("/api/webhooks/payment", {
      data: { type: "payment.succeeded", reference: "CQ4-AAAAAA" },
    });
    expect(res.status()).toBe(501);
  });

  test("robots.txt bloque l'indexation avant le lancement, sitemap disponible", async ({ request }) => {
    expect(await (await request.get("/robots.txt")).text()).toMatch(/Disallow: \/\s*$/m);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(`http://localhost:${E2E_PORT}/formation`);
    expect(sitemap).not.toContain("/admin");
  });

  test("l'image Open Graph est générée", async ({ request }) => {
    const res = await request.get("/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });
});
