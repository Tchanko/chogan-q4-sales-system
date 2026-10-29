import { describe, expect, it } from "vitest";
import { computeEnrollmentState } from "@/lib/enrollment";

const deadline = "2026-11-05T23:59:59+01:00";

describe("ouverture des inscriptions", () => {
  it("est ouverte avant la date limite", () => {
    const s = computeEnrollmentState(new Date("2026-10-23T12:00:00Z"), {
      manuallyOpen: true,
      deadlineIso: deadline,
    });
    expect(s).toMatchObject({ open: true, reason: "open" });
  });

  it("se ferme automatiquement après la date limite", () => {
    const s = computeEnrollmentState(new Date("2026-11-06T00:00:01+01:00"), {
      manuallyOpen: true,
      deadlineIso: deadline,
    });
    expect(s).toMatchObject({ open: false, reason: "deadline_passed" });
  });

  it("peut être fermée manuellement à tout moment", () => {
    const s = computeEnrollmentState(new Date("2026-10-01T00:00:00Z"), {
      manuallyOpen: false,
      deadlineIso: deadline,
    });
    expect(s).toMatchObject({ open: false, reason: "manually_closed" });
  });

  it("utilise la date par défaut de l'offre si la variable est invalide", () => {
    const s = computeEnrollmentState(new Date("2026-12-15T00:00:00Z"), {
      manuallyOpen: true,
      deadlineIso: "pas-une-date",
    });
    expect(s.open).toBe(false);
    expect(s.deadlineIso).toBe(new Date("2026-11-05T23:59:59+01:00").toISOString());
  });
});
