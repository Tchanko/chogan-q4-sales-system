/**
 * Interface de stockage abstraite.
 *
 * Le reste de l'application ne connaît que `Repository`. Trois implémentations :
 * - SupabaseRepository : production (clé « service role » côté serveur uniquement) ;
 * - JsonRepository (fichier local) : développement et tests de bout en bout ;
 * - JsonRepository (mémoire) : tests unitaires.
 *
 * Si aucun stockage n'est configuré, `getRepository()` renvoie null et les
 * formulaires renvoient une erreur explicite : jamais de fausse confirmation.
 */
import type {
  Attribution,
  ChallengeId,
  LeadStatus,
  PaymentVerificationSource,
  RegistrationStatus,
} from "@/lib/domain";

export interface NewLead {
  firstName: string;
  email: string | null;
  /** Numéro WhatsApp au format E.164. */
  whatsapp: string;
  challenge: ChallengeId;
  consentVersion: string;
  attribution: Attribution;
}

export interface LeadRecord extends NewLead {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: LeadStatus;
  submissions: number;
  consentAt: string;
  optedOutAt: string | null;
}

export interface NewRegistration {
  reference: string;
  /** Identifiant de la session (ex. « 2026-11 » pour la Session 1). */
  cohort: string;
  fullName: string;
  whatsapp: string;
  email: string | null;
  /** Code pays ISO 3166-1 alpha-2. */
  country: string;
  paymentMethod: string;
  priceCents: number;
  /** Réservation de place déduite du prix (Session 2), sinon null. */
  depositCents: number | null;
  currency: string;
  termsVersion: string;
  consentEarlyStart: boolean;
  /** Conditions de la réservation acceptées (Session 2). */
  consentDeposit: boolean;
  consentMarketing: boolean;
  attribution: Attribution;
}

export interface RegistrationRecord extends NewRegistration {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: RegistrationStatus;
  paymentVerifiedAt: string | null;
  paymentVerificationSource: PaymentVerificationSource | null;
  paymentProvider: string | null;
  /** Référence de transaction ou justificatif (jamais de donnée bancaire). */
  paymentReference: string | null;
  /** Session 2 : vérification du paiement du solde, après la réservation. */
  balanceVerifiedAt: string | null;
  balanceReference: string | null;
  adminNote: string | null;
}

/** Vue minimale exposée à la page /confirmation. */
export interface RegistrationPublicView {
  id: string;
  reference: string;
  status: RegistrationStatus;
  cohort: string;
  paymentMethod: string;
  priceCents: number;
  depositCents: number | null;
  currency: string;
  createdAt: string;
  paymentVerificationSource: PaymentVerificationSource | null;
  balanceVerifiedAt: string | null;
}

export interface RegistrationPatch {
  status: RegistrationStatus;
  paymentVerifiedAt?: string | null;
  paymentVerificationSource?: PaymentVerificationSource | null;
  paymentProvider?: string | null;
  paymentReference?: string | null;
  balanceVerifiedAt?: string | null;
  balanceReference?: string | null;
  adminNote?: string | null;
}

export interface OptOutContact {
  whatsapp: string | null;
  email: string | null;
}

export type StorageDriverName = "supabase" | "local" | "memory";

export interface Repository {
  readonly driver: StorageDriverName;

  /** Crée le prospect ou met à jour le prospect existant (même numéro WhatsApp). */
  upsertLead(lead: NewLead): Promise<{ id: string; isNew: boolean }>;

  /** Crée une demande d'inscription (la référence doit être unique). */
  createRegistration(registration: NewRegistration): Promise<{ id: string }>;
  findRegistrationPublic(id: string): Promise<RegistrationPublicView | null>;
  getRegistration(id: string): Promise<RegistrationRecord | null>;
  getRegistrationByReference(reference: string): Promise<RegistrationRecord | null>;
  /**
   * Met à jour une inscription. Lève CohortFullError si la confirmation
   * dépasserait la capacité de la session (contrôle du stockage).
   */
  updateRegistration(id: string, patch: RegistrationPatch): Promise<void>;
  /** Nombre d'inscriptions confirmées par session (identifiant → nombre). */
  countConfirmedByCohort(): Promise<Record<string, number>>;

  /** Enregistre une désinscription et l'applique aux prospects / inscrits correspondants. */
  recordOptOut(contact: OptOutContact): Promise<void>;

  updateLeadStatus(id: string, status: LeadStatus): Promise<void>;
  listLeads(limit: number): Promise<LeadRecord[]>;
  listRegistrations(limit: number): Promise<RegistrationRecord[]>;
}

/** Erreur levée quand une confirmation dépasserait la capacité de la session. */
export class CohortFullError extends Error {
  constructor() {
    super("cohort_full");
    this.name = "CohortFullError";
  }
}

/** Erreur levée quand une référence d'inscription existe déjà. */
export class DuplicateReferenceError extends Error {
  constructor() {
    super("duplicate_reference");
    this.name = "DuplicateReferenceError";
  }
}
