/**
 * Configuration du serveur de test. Valeurs de TEST uniquement :
 * elles ne doivent jamais être utilisées en production.
 */
export const E2E_PORT = 3100;
export const E2E_DATA_DIR = ".data-e2e";
export const E2E_ADMIN_PASSWORD = "mot-de-passe-de-test-e2e";
export const E2E_WHATSAPP = "33600000000";

export const E2E_ENV: Record<string, string> = {
  NODE_ENV: "production",
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_SITE_URL: `http://localhost:${E2E_PORT}`,
  NEXT_PUBLIC_ALLOW_INDEXING: "false",
  NEXT_PUBLIC_WHATSAPP_NUMBER: E2E_WHATSAPP,
  NEXT_PUBLIC_REGISTRATION_MODE: "form",
  // Identifiant fictif : active le bandeau de consentement pendant les tests.
  NEXT_PUBLIC_GA4_ID: "G-TEST000000",
  NEXT_PUBLIC_META_PIXEL_ID: "",
  NEXT_PUBLIC_TIKTOK_PIXEL_ID: "",
  STORAGE_DRIVER: "local",
  LOCAL_DATA_DIR: E2E_DATA_DIR,
  SUPABASE_URL: "",
  SUPABASE_SECRET_KEY: "",
  APP_SECRET: "secret-de-test-e2e-uniquement-0123456789abcdef",
  ADMIN_PASSWORD: E2E_ADMIN_PASSWORD,
  ENROLLMENT_OPEN: "true",
  ENROLLMENT_DEADLINE: "2099-12-31T23:59:59Z",
};
