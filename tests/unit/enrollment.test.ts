import { describe, expect, it } from "vitest";
import { computeEnrollmentState, focusCohort, seatsLabel } from "@/lib/enrollment";

const S1 = "2026-11";
const S2 = "2026-12";
const auto = { manuallyOpen: true, deadlineIso: null };
const statuses = (s: ReturnType<typeof computeEnrollmentState>) => s.cohorts.map((c) => c.status);

describe("ouverture des inscriptions par session", () => {
  it("ouvre la Session 1 seule tant qu'elle a des places et que sa date limite n'est pas passée", () => {
    const s = computeEnrollmentState(new Date("2026-10-30T12:00:00Z"), auto, { [S1]: 3 });
    expect(s).toMatchObject({ open: true, reason: "open", cohortId: S1 });
    expect(statuses(s)).toEqual(["open", "waiting"]);
    expect(s.cohorts[0]).toMatchObject({ confirmed: 3, remaining: 7, capacity: 10 });
    expect(seatsLabel(s.cohorts[0])).toBe("7 places restantes sur 10");
  });

  it("reste ouverte jusqu'à 3 jours après le démarrage (9 novembre, 23 h 59, heure de Paris)", () => {
    const before = computeEnrollmentState(new Date("2026-11-09T23:59:00+01:00"), auto, {});
    expect(before.cohortId).toBe(S1);
    expect(before.deadlineIso).toBe(new Date("2026-11-09T23:59:59+01:00").toISOString());
    const after = computeEnrollmentState(new Date("2026-11-10T00:00:01+01:00"), auto, {});
    expect(after.cohortId).toBe(S2);
    expect(statuses(after)).toEqual(["deadline_passed", "open"]);
  });

  it("ferme la Session 1 dès 10 inscriptions confirmées et ouvre la Session 2", () => {
    const s = computeEnrollmentState(new Date("2026-11-02T12:00:00Z"), auto, { [S1]: 10 });
    expect(s).toMatchObject({ open: true, cohortId: S2 });
    expect(statuses(s)).toEqual(["full", "open"]);
    expect(seatsLabel(s.cohorts[0])).toBe("Complet");
    expect(focusCohort(s).cohort.deposit?.label).toBe("50 €");
  });

  it("n'ouvre pas de troisième session : tout est fermé après la Session 2", () => {
    const full = computeEnrollmentState(new Date("2026-11-20T12:00:00Z"), auto, { [S1]: 10, [S2]: 10 });
    expect(full).toMatchObject({ open: false, reason: "closed", cohortId: null });
    expect(statuses(full)).toEqual(["full", "full"]);
    const late = computeEnrollmentState(new Date("2026-12-12T00:00:01+01:00"), auto, { [S1]: 4, [S2]: 2 });
    expect(late).toMatchObject({ open: false, reason: "closed" });
    expect(statuses(late)).toEqual(["deadline_passed", "deadline_passed"]);
  });

  it("peut être fermée manuellement à tout moment", () => {
    const s = computeEnrollmentState(new Date("2026-10-01T00:00:00Z"), { ...auto, manuallyOpen: false }, {});
    expect(s).toMatchObject({ open: false, reason: "manually_closed", cohortId: null });
    expect(focusCohort(s).cohort.id).toBe(S1);
  });

  it("n'affiche aucun compteur si le comptage est indisponible", () => {
    const s = computeEnrollmentState(new Date("2026-10-30T12:00:00Z"), auto, null);
    expect(s.cohortId).toBe(S1);
    expect(s.cohorts[0]).toMatchObject({ confirmed: null, remaining: null });
    expect(seatsLabel(s.cohorts[0])).toBeNull();
  });

  it("ENROLLMENT_DEADLINE remplace la date limite de la Session 1 ; une valeur invalide est ignorée", () => {
    const now = new Date("2026-11-03T12:00:00Z");
    const early = computeEnrollmentState(now, { ...auto, deadlineIso: "2026-11-01T00:00:00Z" }, {});
    expect(early.cohortId).toBe(S2);
    const invalid = computeEnrollmentState(now, { ...auto, deadlineIso: "pas-une-date" }, {});
    expect(invalid.cohortId).toBe(S1);
    expect(invalid.deadlineIso).toBe(new Date("2026-11-09T23:59:59+01:00").toISOString());
  });

  it("écrit « 1 place restante » au singulier", () => {
    const s = computeEnrollmentState(new Date("2026-10-30T12:00:00Z"), auto, { [S1]: 9 });
    expect(seatsLabel(s.cohorts[0])).toBe("1 place restante sur 10");
  });
});
