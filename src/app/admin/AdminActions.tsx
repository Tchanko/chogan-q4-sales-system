"use client";

import { useActionState, useId } from "react";
import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_TRANSITIONS,
  type LeadStatus,
  type RegistrationStatus,
} from "@/lib/domain";
import {
  confirmBalanceAction,
  confirmPaymentAction,
  leadStatusAction,
  logoutAction,
  registrationStatusAction,
  type ActionState,
} from "./actions";

const initial: ActionState = { ok: false, message: null };

function Feedback({ state }: { state: ActionState }) {
  return (
    <p role="status" aria-live="polite" className={`text-xs font-semibold ${state.ok ? "text-cyan-ink" : "text-danger"}`}>
      {state.message}
    </p>
  );
}

export function RegistrationActions({
  id,
  reference,
  status,
  depositLabel,
  awaitingBalance,
}: {
  id: string;
  reference: string;
  status: RegistrationStatus;
  /** Session 2 : montant de la réservation qui confirme la place. */
  depositLabel: string | null;
  /** Session 2 : réservation confirmée, solde pas encore vérifié. */
  awaitingBalance: boolean;
}) {
  const [statusState, statusAction, statusPending] = useActionState(registrationStatusAction, initial);
  const uid = useId();
  const canConfirm = status === "request_received" || status === "payment_pending";

  return (
    <div className="space-y-2">
      <form action={statusAction} className="flex items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <label htmlFor={`${uid}-status`} className="sr-only">
          Nouveau statut pour {reference}
        </label>
        <select id={`${uid}-status`} name="status" className="field-input min-h-9 py-1 text-sm" defaultValue="">
          <option value="" disabled>
            Changer le statut…
          </option>
          {REGISTRATION_TRANSITIONS[status].map((s) => (
            <option key={s} value={s}>
              {REGISTRATION_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-outline min-h-9 px-3 py-1 text-sm" disabled={statusPending}>
          OK
        </button>
      </form>
      <Feedback state={statusState} />

      {canConfirm && (
        <ManualProofForm
          id={id}
          action={confirmPaymentAction}
          summary={depositLabel ? `Confirmer la réservation (${depositLabel})…` : "Confirmer le paiement…"}
          checkboxLabel={
            depositLabel
              ? `J'ai vérifié la réception effective de la réservation de ${depositLabel} (${reference}).`
              : `J'ai vérifié la réception effective du paiement (${reference}).`
          }
          submitLabel={depositLabel ? "Confirmer la place" : "Confirmer l'inscription"}
        />
      )}
      {awaitingBalance && (
        <ManualProofForm
          id={id}
          action={confirmBalanceAction}
          summary="Confirmer le solde…"
          checkboxLabel={`J'ai vérifié la réception effective du solde (${reference}).`}
          submitLabel="Confirmer le solde"
        />
      )}
    </div>
  );
}

/** Vérification manuelle d'un paiement : référence de transaction + case de vérification. */
function ManualProofForm({
  id,
  action,
  summary,
  checkboxLabel,
  submitLabel,
}: {
  id: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  summary: string;
  checkboxLabel: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const uid = useId();
  return (
    <details className="rounded-lg border border-line p-3">
      <summary className="cursor-pointer text-sm font-bold">{summary}</summary>
      <form action={formAction} className="mt-3 space-y-3">
        <input type="hidden" name="id" value={id} />
        <div>
          <label htmlFor={`${uid}-ref`} className="text-xs font-semibold">
            Référence de la transaction (jamais de numéro de carte ni d&apos;IBAN)
          </label>
          <input
            id={`${uid}-ref`}
            name="paymentReference"
            defaultValue={state.values?.paymentReference}
            className="field-input min-h-9 py-1 text-sm"
            maxLength={200}
            required
            aria-invalid={state.fieldErrors?.paymentReference ? true : undefined}
          />
          {state.fieldErrors?.paymentReference && (
            <p className="field-error text-xs">{state.fieldErrors.paymentReference}</p>
          )}
        </div>
        <div>
          <label htmlFor={`${uid}-note`} className="text-xs font-semibold">
            Note interne (facultatif)
          </label>
          <textarea
            id={`${uid}-note`}
            name="note"
            rows={2}
            maxLength={1000}
            defaultValue={state.values?.note}
            className="field-input py-1 text-sm"
          />
        </div>
        <label className="flex items-start gap-2 text-xs">
          <input type="checkbox" name="verified" className="mt-0.5 size-4 accent-ink" />
          <span>{checkboxLabel}</span>
        </label>
        {state.fieldErrors?.verified && <p className="field-error text-xs">{state.fieldErrors.verified}</p>}
        <button type="submit" className="btn btn-dark min-h-9 w-full px-3 py-1 text-sm" disabled={pending}>
          {submitLabel}
        </button>
        <Feedback state={state} />
      </form>
    </details>
  );
}

export function LeadActions({ id, status }: { id: string; status: LeadStatus }) {
  const [state, action, pending] = useActionState(leadStatusAction, initial);
  if (status === "unsubscribed") return <span className="text-xs text-muted">Désinscrit</span>;
  const next: LeadStatus = status === "new" ? "contacted" : "new";
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={next} />
      <button type="submit" className="btn btn-outline min-h-9 px-3 py-1 text-xs" disabled={pending}>
        {next === "contacted" ? "Marquer contacté" : "Repasser en nouveau"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="btn btn-outline min-h-10 px-4 py-2 text-sm">
        Se déconnecter
      </button>
    </form>
  );
}
