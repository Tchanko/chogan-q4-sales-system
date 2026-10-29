/**
 * Point d'entrée du stockage : choisit le pilote selon la configuration.
 * Renvoie null si aucun stockage n'est configuré — les appelants doivent
 * alors refuser l'enregistrement (jamais de fausse confirmation).
 */
import "server-only";
import path from "node:path";
import { getStorageConfig } from "@/lib/config/server-env";
import { JsonRepository, filePersistence, memoryPersistence } from "./json-repository";
import { SupabaseRepository } from "./supabase-repository";
import type { Repository } from "./types";

const CACHE_KEY = Symbol.for("cq4.repository");

interface CachedRepository {
  signature: string;
  repository: Repository;
}

let warnedMissing = false;

export function getRepository(): Repository | null {
  const config = getStorageConfig();
  if (config.mode === "none") {
    if (!warnedMissing) {
      console.warn(`[stockage] désactivé : ${config.problem}`);
      warnedMissing = true;
    }
    return null;
  }

  const signature = [config.mode, config.supabaseUrl, config.localDataDir].join("|");
  const g = globalThis as unknown as Record<symbol, CachedRepository | undefined>;
  const cached = g[CACHE_KEY];
  if (cached && cached.signature === signature) return cached.repository;

  let repository: Repository;
  switch (config.mode) {
    case "supabase":
      repository = new SupabaseRepository(config.supabaseUrl!, config.supabaseKey!);
      break;
    case "local": {
      // Pilote de test : exclu du traçage des fichiers déployés.
      const dir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), config.localDataDir);
      if (process.env.NODE_ENV === "production") {
        console.warn(
          `[stockage] pilote fichier local actif (${dir}) : réservé aux tests, à remplacer par Supabase en production.`,
        );
      }
      repository = new JsonRepository("local", filePersistence(dir), `file:${dir}`);
      break;
    }
    case "memory":
      repository = new JsonRepository("memory", memoryPersistence());
      break;
  }
  g[CACHE_KEY] = { signature, repository };
  return repository;
}

/** Réinitialise le cache (tests). */
export function resetRepositoryCache(): void {
  const g = globalThis as unknown as Record<symbol, CachedRepository | undefined>;
  delete g[CACHE_KEY];
}

export type { Repository } from "./types";
