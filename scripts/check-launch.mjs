#!/usr/bin/env node
/**
 * Vérifications avant mise en ligne : `npm run check:launch`
 *
 * Lit .env.local / .env.production(.local) puis les variables d'environnement
 * du terminal (prioritaires), et signale :
 *  ✖ ce qui bloque la mise en ligne (code de sortie 1) ;
 *  ⚠ ce qui mérite une vérification ;
 *  ✔ ce qui est correctement configuré.
 * Aucune valeur secrète n'est affichée.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function parseEnvFile(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = {
  ...parseEnvFile(path.join(root, ".env.local")),
  ...parseEnvFile(path.join(root, ".env.production")),
  ...parseEnvFile(path.join(root, ".env.production.local")),
  ...Object.fromEntries(Object.entries(process.env).filter(([k]) => /^(NEXT_PUBLIC_|SUPABASE_|STORAGE_|APP_|ADMIN_|ENROLLMENT_|LOCAL_)/.test(k))),
};
const get = (k) => (env[k] ?? "").trim();

const results = [];
const ok = (msg) => results.push(["✔", msg]);
const warn = (msg) => results.push(["⚠", msg]);
const fail = (msg) => results.push(["✖", msg]);

// --- Stockage --------------------------------------------------------------
const supabaseKey = get("SUPABASE_SECRET_KEY") || get("SUPABASE_SERVICE_ROLE_KEY");
if (get("STORAGE_DRIVER") === "local") fail("STORAGE_DRIVER=local : stockage de test, à retirer en production.");
if (get("SUPABASE_URL") && supabaseKey) {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(get("SUPABASE_URL")))
    warn("SUPABASE_URL ne ressemble pas à https://<projet>.supabase.co : à vérifier.");
  else ok("Supabase configuré (URL + clé secrète).");
  if (supabaseKey.startsWith("sb_publishable_") || supabaseKey.length < 30)
    fail("La clé Supabase semble être une clé publique : utilisez la clé SECRÈTE (sb_secret_… ou service_role).");
} else {
  fail("Supabase non configuré (SUPABASE_URL et SUPABASE_SECRET_KEY) : les formulaires refuseront tout envoi.");
}

// --- Sécurité ---------------------------------------------------------------
const secret = get("APP_SECRET");
if (secret.length >= 48) ok("APP_SECRET défini (longueur suffisante).");
else if (secret.length >= 32) warn("APP_SECRET valide mais court : 48 caractères aléatoires ou plus conseillés.");
else fail("APP_SECRET manquant ou trop court (32 caractères minimum) : inscriptions et admin désactivées.");

const adminPassword = get("ADMIN_PASSWORD");
if (adminPassword.length >= 16) ok("ADMIN_PASSWORD défini.");
else if (adminPassword.length >= 12) warn("ADMIN_PASSWORD valide mais court : 16 caractères ou plus conseillés.");
else fail("ADMIN_PASSWORD manquant ou trop court (12 caractères minimum) : tableau de bord inaccessible.");

// --- Site ----------------------------------------------------------------------
const siteUrl = get("NEXT_PUBLIC_SITE_URL");
if (/^https:\/\//.test(siteUrl) && !/localhost|127\.0\.0\.1/.test(siteUrl)) ok(`URL du site : ${siteUrl}`);
else fail("NEXT_PUBLIC_SITE_URL doit être l'adresse publique en https (balises canoniques, sitemap, Open Graph).");

const wa = get("NEXT_PUBLIC_WHATSAPP_NUMBER").replace(/\D/g, "");
if (wa.length >= 8 && wa.length <= 15) ok("Numéro WhatsApp configuré.");
else fail("NEXT_PUBLIC_WHATSAPP_NUMBER manquant : aucun bouton WhatsApp ne sera affiché.");

if (get("NEXT_PUBLIC_ALLOW_INDEXING") === "true") ok("Indexation par les moteurs de recherche activée.");
else warn("Indexation désactivée (NEXT_PUBLIC_ALLOW_INDEXING) : à passer à true le jour du lancement.");

if (get("NEXT_PUBLIC_REGISTRATION_MODE") === "whatsapp") warn("Bouton principal vers WhatsApp (mode « whatsapp ») : vérifiez que c'est voulu.");

// --- Inscriptions --------------------------------------------------------------
const offerSource = readFileSync(path.join(root, "src/content/offer.ts"), "utf8");
const defaultDeadline = offerSource.match(/enrollmentDeadlineIso:\s*"([^"]+)"/)?.[1];
const deadlineIso = get("ENROLLMENT_DEADLINE") || defaultDeadline;
const deadline = new Date(deadlineIso ?? "");
if (Number.isNaN(deadline.getTime())) fail(`Date limite d'inscription invalide : ${deadlineIso}`);
else if (deadline.getTime() < Date.now()) warn(`Date limite d'inscription dépassée (${deadlineIso}) : les inscriptions sont fermées.`);
else ok(`Inscriptions ouvertes jusqu'au ${deadline.toLocaleString("fr-FR", { timeZone: "Europe/Paris" })} (heure de Paris).`);
if (["false", "0", "non"].includes(get("ENROLLMENT_OPEN").toLowerCase())) warn("ENROLLMENT_OPEN=false : inscriptions fermées manuellement.");

// --- Mesure ------------------------------------------------------------------------
const ga = get("NEXT_PUBLIC_GA4_ID");
if (ga && !/^G-[A-Z0-9]{4,}$/.test(ga)) fail(`NEXT_PUBLIC_GA4_ID invalide (format attendu G-XXXXXXX) : ${ga}`);
const meta = get("NEXT_PUBLIC_META_PIXEL_ID");
if (meta && !/^\d{10,20}$/.test(meta)) fail("NEXT_PUBLIC_META_PIXEL_ID invalide (identifiant numérique attendu).");
if (!ga && !meta && !get("NEXT_PUBLIC_TIKTOK_PIXEL_ID")) warn("Aucun outil de mesure configuré (aucun bandeau cookies affiché).");
else ok("Outils de mesure configurés (chargés uniquement après consentement).");

// --- Contenus à compléter --------------------------------------------------------------
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const placeholders = walk(path.join(root, "src"))
  .filter((f) => /\.(tsx?|mdx?)$/.test(f))
  // Le composant <Todo> lui-même n'est pas un passage à compléter.
  .filter((f) => !f.endsWith(path.join("components", "legal", "LegalPage.tsx")))
  .map((f) => {
    const text = readFileSync(f, "utf8");
    const count = (text.match(/<Todo>/g) ?? []).length + (text.match(/\[À COMPLÉTER/g) ?? []).length;
    return [path.relative(root, f), count];
  })
  .filter(([, n]) => n > 0);
if (placeholders.length === 0) ok("Aucun passage « À COMPLÉTER » restant.");
for (const [file, n] of placeholders) fail(`${n} passage(s) « À COMPLÉTER » dans ${file}`);

// --- Garantie 60 jours (src/content/guarantee.ts) ---------------------------------------
const guaranteeSource = readFileSync(path.join(root, "src/content/guarantee.ts"), "utf8");
const decisionsBlock = guaranteeSource.match(/pendingDecisions:\s*\{([\s\S]*?)\}/)?.[1] ?? "";
const missingDecisions = [...decisionsBlock.matchAll(/^\s*(\w+):\s*null,?\s*$/gm)].map((m) => m[1]);
if (missingDecisions.length)
  fail(`Garantie : ${missingDecisions.length} décision(s) à prendre avant publication (${missingDecisions.join(", ")}) — voir README, section « Garantie 60 jours ».`);
if (/termsFinalized:\s*false/.test(guaranteeSource))
  fail("Garantie : conditions des CGV non finalisées (termsFinalized: false).");
if (/legalReviewDone:\s*false/.test(guaranteeSource))
  fail("Garantie : relecture juridique non effectuée (legalReviewDone: false).");
if (!missingDecisions.length && /termsFinalized:\s*true/.test(guaranteeSource) && /legalReviewDone:\s*true/.test(guaranteeSource))
  ok("Garantie : décisions prises, CGV finalisées et relues.");
const bonusesPending = (offerSource.match(/available: false/g) ?? []).length;
if (bonusesPending) warn(`${bonusesPending} bonus marqués « En préparation » : passez available à true quand leurs fichiers existent.`);
warn("Moyens de paiement (src/content/offer.ts) : vérifiez que la liste correspond aux moyens réellement acceptés.");

// --- Rapport --------------------------------------------------------------------------------
console.log("\nVérification avant mise en ligne — CHOGAN Q4 SALES SYSTEM\n");
for (const [icon, msg] of results) console.log(`  ${icon} ${msg}`);
const blocking = results.filter(([i]) => i === "✖").length;
console.log(
  blocking
    ? `\n${blocking} point(s) bloquant(s). Corrigez-les avant la mise en ligne.\n`
    : "\nAucun point bloquant détecté. Effectuez aussi la recette manuelle (docs/CHECKLIST-MISE-EN-LIGNE.md).\n",
);
process.exit(blocking ? 1 : 0);
