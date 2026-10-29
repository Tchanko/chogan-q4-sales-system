import { rm } from "node:fs/promises";
import path from "node:path";
import { E2E_DATA_DIR } from "./env";

/** Repart d'un stockage de test vide à chaque exécution. */
export default async function globalSetup() {
  await rm(path.resolve(process.cwd(), E2E_DATA_DIR), { recursive: true, force: true });
}
