import { defineConfig, devices } from "@playwright/test";
import { E2E_ENV, E2E_PORT } from "./tests/e2e/env";

/**
 * Tests de bout en bout : build de production + serveur local avec un
 * stockage fichier dédié (.data-e2e) et des secrets de test.
 *
 * Navigateur : Chromium téléchargé par `npx playwright install chromium`,
 * ou un navigateur déjà installé via PLAYWRIGHT_CHANNEL=msedge / chrome.
 */
export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: process.env.PLAYWRIGHT_CHANNEL || undefined } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: process.env.PLAYWRIGHT_CHANNEL || undefined } },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${E2E_PORT}`,
    url: `http://localhost:${E2E_PORT}`,
    timeout: 600_000,
    reuseExistingServer: false,
    stdout: "ignore",
    stderr: "pipe",
    env: E2E_ENV,
  },
});
