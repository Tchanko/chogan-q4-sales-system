import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // « server-only » refuse d'être importé hors du rendu serveur React.
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/sql/**/*.test.ts"],
    env: { NODE_ENV: "test" },
    testTimeout: 30_000,
    // Le démarrage de PostgreSQL embarqué (tests/sql) peut dépasser 10 s sur une machine chargée.
    hookTimeout: 60_000,
  },
});
