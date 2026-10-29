import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { EMPTY_ATTRIBUTION } from "@/lib/domain";
import { JsonRepository, filePersistence } from "@/lib/storage/json-repository";

const dirs: string[] = [];
afterAll(async () => {
  await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
});

describe("pilote fichier local", () => {
  it("persiste les données sur disque et sérialise les écritures concurrentes", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "cq4-"));
    dirs.push(dir);
    const repo = new JsonRepository("local", filePersistence(dir), `file:${dir}`);

    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        repo.upsertLead({
          firstName: `P${i}`,
          email: null,
          whatsapp: `+3361234560${i}`,
          challenge: "ia",
          consentVersion: "v1",
          attribution: EMPTY_ATTRIBUTION,
        }),
      ),
    );

    const reopened = new JsonRepository("local", filePersistence(dir), `file:${dir}-2`);
    expect(await reopened.listLeads(100)).toHaveLength(10);
    const raw = JSON.parse(await readFile(path.join(dir, "db.json"), "utf8"));
    expect(raw.leads).toHaveLength(10);
  });
});
