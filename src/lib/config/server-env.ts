/**
 * Configuration serveur, lue à chaque appel (jamais exposée au navigateur).
 * Toutes les variables sont documentées dans .env.example.
 */
import "server-only";

export type StorageMode = "supabase" | "local" | "memory" | "none";

function clean(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

export interface StorageConfig {
  mode: StorageMode;
  /** Raison lisible quand le stockage n'est pas disponible. */
  problem: string | null;
  supabaseUrl: string | null;
  supabaseKey: string | null;
  localDataDir: string;
}

export function getStorageConfig(): StorageConfig {
  const supabaseUrl = clean(process.env.SUPABASE_URL);
  // Nouvelle clé secrète Supabase (sb_secret_…) ou ancienne clé service_role.
  const supabaseKey =
    clean(process.env.SUPABASE_SECRET_KEY) ?? clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const requested = clean(process.env.STORAGE_DRIVER)?.toLowerCase() ?? null;
  const localDataDir = clean(process.env.LOCAL_DATA_DIR) ?? ".data";
  const base = { supabaseUrl, supabaseKey, localDataDir };
  const hasSupabase = Boolean(supabaseUrl && supabaseKey);

  if (requested === "local") return { ...base, mode: "local", problem: null };
  if (requested === "memory") {
    // Stockage volatil : réservé aux tests automatisés.
    if (process.env.NODE_ENV === "test") return { ...base, mode: "memory", problem: null };
    return { ...base, mode: "none", problem: "STORAGE_DRIVER=memory est réservé aux tests." };
  }
  if (requested === "supabase" || requested === null) {
    if (hasSupabase) return { ...base, mode: "supabase", problem: null };
    return {
      ...base,
      mode: "none",
      problem:
        requested === "supabase"
          ? "STORAGE_DRIVER=supabase mais SUPABASE_URL ou SUPABASE_SECRET_KEY est manquant."
          : "Aucun stockage configuré (SUPABASE_URL / SUPABASE_SECRET_KEY ou STORAGE_DRIVER=local).",
    };
  }
  return { ...base, mode: "none", problem: `STORAGE_DRIVER inconnu : ${requested}` };
}

/** Secret applicatif (signature des cookies). null si absent ou trop court. */
export function getAppSecret(): string | null {
  const secret = clean(process.env.APP_SECRET);
  return secret && secret.length >= 32 ? secret : null;
}

export interface AdminConfig {
  enabled: boolean;
  password: string | null;
  secret: string | null;
}

/** L'administration n'est active que si un mot de passe solide ET APP_SECRET existent. */
export function getAdminConfig(): AdminConfig {
  const password = clean(process.env.ADMIN_PASSWORD);
  const secret = getAppSecret();
  const enabled = Boolean(password && password.length >= 12 && secret);
  return { enabled, password: enabled ? password : null, secret: enabled ? secret : null };
}

export interface EnrollmentConfig {
  /** Interrupteur manuel : ENROLLMENT_OPEN=false ferme immédiatement les inscriptions. */
  manuallyOpen: boolean;
  /** Date limite (ISO) ; remplace celle de src/content/offer.ts si définie. */
  deadlineIso: string | null;
}

export function getEnrollmentConfig(): EnrollmentConfig {
  const flag = clean(process.env.ENROLLMENT_OPEN)?.toLowerCase();
  return {
    manuallyOpen: flag !== "false" && flag !== "0" && flag !== "non",
    deadlineIso: clean(process.env.ENROLLMENT_DEADLINE),
  };
}
