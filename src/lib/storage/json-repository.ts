/**
 * Implémentation JSON du stockage : fichier local (développement, tests de
 * bout en bout) ou mémoire (tests unitaires).
 *
 * ⚠️ Le pilote fichier n'est PAS destiné à la production : il ne gère qu'un
 * seul processus et les hébergeurs « serverless » n'ont pas de disque durable.
 */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { findCohort } from "@/content/offer";
import {
  CohortFullError,
  DuplicateReferenceError,
  type LeadRecord,
  type NewLead,
  type NewRegistration,
  type OptOutContact,
  type RegistrationPatch,
  type RegistrationPublicView,
  type RegistrationRecord,
  type Repository,
} from "./types";
import type { LeadStatus } from "@/lib/domain";

interface OptOutRecord {
  id: string;
  whatsapp: string | null;
  email: string | null;
  createdAt: string;
}

export interface JsonData {
  leads: LeadRecord[];
  registrations: RegistrationRecord[];
  optOuts: OptOutRecord[];
}

export interface Persistence {
  load(): Promise<JsonData>;
  save(data: JsonData): Promise<void>;
}

const emptyData = (): JsonData => ({ leads: [], registrations: [], optOuts: [] });

/** Persistance en mémoire (une copie profonde à chaque lecture / écriture). */
export function memoryPersistence(initial: JsonData = emptyData()): Persistence {
  let snapshot = structuredClone(initial);
  return {
    async load() {
      return structuredClone(snapshot);
    },
    async save(data) {
      snapshot = structuredClone(data);
    },
  };
}

/** Persistance dans un fichier JSON, avec écriture atomique (fichier temporaire + renommage). */
export function filePersistence(dir: string): Persistence {
  const file = path.join(dir, "db.json");
  return {
    async load() {
      try {
        const raw = await readFile(file, "utf8");
        const parsed = JSON.parse(raw) as Partial<JsonData>;
        return {
          leads: parsed.leads ?? [],
          registrations: parsed.registrations ?? [],
          optOuts: parsed.optOuts ?? [],
        };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyData();
        throw error;
      }
    },
    async save(data) {
      await mkdir(dir, { recursive: true });
      const tmp = `${file}.${process.pid}.${randomUUID()}.tmp`;
      await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
      await rename(tmp, file);
    },
  };
}

/**
 * File d'attente partagée par clé (via globalThis) pour sérialiser les
 * écritures, même si le module est chargé plusieurs fois par Next.js.
 */
const QUEUES_KEY = Symbol.for("cq4.jsonRepository.queues");
type QueueMap = Map<string, Promise<unknown>>;
function queues(): QueueMap {
  const g = globalThis as unknown as Record<symbol, QueueMap | undefined>;
  return (g[QUEUES_KEY] ??= new Map());
}

export class JsonRepository implements Repository {
  constructor(
    readonly driver: "local" | "memory",
    private readonly persistence: Persistence,
    private readonly queueKey: string = randomUUID(),
    private readonly clock: () => Date = () => new Date(),
  ) {}

  private run<T>(fn: (data: JsonData) => T, mutate: boolean): Promise<T> {
    const map = queues();
    const previous = map.get(this.queueKey) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(async () => {
        const data = await this.persistence.load();
        const result = fn(data);
        if (mutate) await this.persistence.save(data);
        return result;
      });
    map.set(this.queueKey, next);
    return next;
  }

  private now(): string {
    return this.clock().toISOString();
  }

  upsertLead(lead: NewLead): Promise<{ id: string; isNew: boolean }> {
    return this.run((data) => {
      const now = this.now();
      const existing = data.leads.find((l) => l.whatsapp === lead.whatsapp);
      if (existing) {
        existing.firstName = lead.firstName;
        existing.email = lead.email ?? existing.email;
        existing.challenge = lead.challenge;
        existing.consentVersion = lead.consentVersion;
        existing.consentAt = now;
        existing.updatedAt = now;
        existing.submissions += 1;
        // Une nouvelle demande explicite vaut nouveau consentement.
        if (existing.status === "unsubscribed") existing.status = "new";
        existing.optedOutAt = null;
        // L'attribution d'origine (premier contact) est conservée.
        return { id: existing.id, isNew: false };
      }
      const record: LeadRecord = {
        ...lead,
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        status: "new",
        submissions: 1,
        consentAt: now,
        optedOutAt: null,
      };
      data.leads.push(record);
      return { id: record.id, isNew: true };
    }, true);
  }

  createRegistration(registration: NewRegistration): Promise<{ id: string }> {
    return this.run((data) => {
      if (data.registrations.some((r) => r.reference === registration.reference)) {
        throw new DuplicateReferenceError();
      }
      const now = this.now();
      const record: RegistrationRecord = {
        ...registration,
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        status: "request_received",
        paymentVerifiedAt: null,
        paymentVerificationSource: null,
        paymentProvider: null,
        paymentReference: null,
        balanceVerifiedAt: null,
        balanceReference: null,
        adminNote: null,
      };
      data.registrations.push(record);
      return { id: record.id };
    }, true);
  }

  findRegistrationPublic(id: string): Promise<RegistrationPublicView | null> {
    return this.run((data) => {
      const r = data.registrations.find((x) => x.id === id);
      if (!r) return null;
      return {
        id: r.id,
        reference: r.reference,
        status: r.status,
        cohort: r.cohort,
        paymentMethod: r.paymentMethod,
        priceCents: r.priceCents,
        depositCents: r.depositCents ?? null,
        currency: r.currency,
        createdAt: r.createdAt,
        paymentVerificationSource: r.paymentVerificationSource,
        balanceVerifiedAt: r.balanceVerifiedAt ?? null,
      };
    }, false);
  }

  getRegistration(id: string): Promise<RegistrationRecord | null> {
    return this.run((data) => data.registrations.find((r) => r.id === id) ?? null, false);
  }

  getRegistrationByReference(reference: string): Promise<RegistrationRecord | null> {
    return this.run(
      (data) => data.registrations.find((r) => r.reference === reference) ?? null,
      false,
    );
  }

  updateRegistration(id: string, patch: RegistrationPatch): Promise<void> {
    return this.run((data) => {
      const r = data.registrations.find((x) => x.id === id);
      if (!r) throw new Error("registration_not_found");
      // Même garde-fou que le déclencheur SQL : jamais plus de places confirmées que la capacité.
      const capacity = findCohort(r.cohort)?.capacity;
      if (patch.status === "confirmed" && r.status !== "confirmed" && capacity !== undefined) {
        const confirmed = data.registrations.filter(
          (x) => x.cohort === r.cohort && x.status === "confirmed",
        ).length;
        if (confirmed >= capacity) throw new CohortFullError();
      }
      Object.assign(r, stripUndefined(patch), { updatedAt: this.now() });
    }, true);
  }

  countConfirmedByCohort(): Promise<Record<string, number>> {
    return this.run((data) => {
      const counts: Record<string, number> = {};
      for (const r of data.registrations) {
        if (r.status === "confirmed") counts[r.cohort] = (counts[r.cohort] ?? 0) + 1;
      }
      return counts;
    }, false);
  }

  recordOptOut(contact: OptOutContact): Promise<void> {
    return this.run((data) => {
      const now = this.now();
      data.optOuts.push({ id: randomUUID(), ...contact, createdAt: now });
      const matches = (whatsapp: string, email: string | null) =>
        (contact.whatsapp !== null && whatsapp === contact.whatsapp) ||
        (contact.email !== null && email !== null && email === contact.email);
      for (const lead of data.leads) {
        if (matches(lead.whatsapp, lead.email)) {
          lead.status = "unsubscribed";
          lead.optedOutAt = now;
          lead.updatedAt = now;
        }
      }
      for (const reg of data.registrations) {
        if (matches(reg.whatsapp, reg.email)) {
          reg.consentMarketing = false;
          reg.updatedAt = now;
        }
      }
    }, true);
  }

  updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
    return this.run((data) => {
      const lead = data.leads.find((l) => l.id === id);
      if (!lead) throw new Error("lead_not_found");
      lead.status = status;
      lead.updatedAt = this.now();
    }, true);
  }

  listLeads(limit: number): Promise<LeadRecord[]> {
    return this.run(
      (data) =>
        [...data.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit),
      false,
    );
  }

  listRegistrations(limit: number): Promise<RegistrationRecord[]> {
    return this.run(
      (data) =>
        [...data.registrations]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, limit),
      false,
    );
  }
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
