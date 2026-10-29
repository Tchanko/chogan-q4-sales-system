import { test as base, expect, type Page } from "@playwright/test";

/**
 * Fixtures communes :
 * - toute requête vers un domaine externe est bloquée (aucun appel réel à
 *   Google, Meta ou TikTok pendant les tests) et journalisée ;
 * - par défaut, le visiteur a déjà refusé les cookies (le bandeau ne gêne pas
 *   les parcours). Le test du consentement utilise `freshVisitor`.
 */
export const test = base.extend<{ externalRequests: string[]; freshVisitor: boolean }>({
  freshVisitor: [false, { option: true }],
  externalRequests: [
    async ({ page, freshVisitor }, use) => {
      const external: string[] = [];
      await page.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return route.continue();
        external.push(url.href);
        return route.fulfill({ status: 204, body: "" });
      });
      if (!freshVisitor) {
        await page.addInitScript(() => {
          if (!window.localStorage.getItem("cq4_consent")) {
            window.localStorage.setItem(
              "cq4_consent",
              JSON.stringify({ version: 1, analytics: false, marketing: false, decidedAt: new Date().toISOString() }),
            );
          }
        });
      }
      await use(external);
    },
    { auto: true },
  ],
});

export { expect };

/** Attend que le délai anti-robots (2,5 s) soit écoulé avant d'envoyer un formulaire. */
export async function waitHumanDelay(page: Page) {
  await page.waitForTimeout(2700);
}

/** Aucun défilement horizontal (affichage mobile). */
export async function expectNoHorizontalScroll(page: Page) {
  const report = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const overflow = document.documentElement.scrollWidth - width;
    // Éléments qui dépassent le bord droit (hors contenu des zones défilantes prévues).
    const culprits = [...document.querySelectorAll<HTMLElement>("body *")]
      .map((el) => ({ el, right: el.getBoundingClientRect().right + window.scrollX }))
      .filter(({ el, right }) => right > width + 1 && !el.parentElement?.closest(".overflow-x-auto"))
      .slice(0, 8)
      .map(({ el, right }) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} [${Math.round(right)}/${width}]`);
    return { overflow, culprits };
  });
  expect(report.overflow, `Débordement horizontal : ${report.culprits.join(" | ")}`).toBeLessThanOrEqual(0);
}
