"use client";

import { useActionState, useId } from "react";
import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_TRANSITIONS,
  type LeadStatus,
  type RegistrationStatus,
} from "@/lib/domain";
import {
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
}: {
  id: string;
  reference: string;
  status: RegistrationStatus;
}) {
  const [statusState, statusAction, statusPending] = useActionState(registrationStatusAction, initial);
  const [payState, payAction, payPending] = useActionState(confirmPaymentAction, initial);
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
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-sm font-bold">Confirmer le paiement…</summary>
          <form action={payAction} className="mt-3 space-y-3">
            <input type="hidden" name="id" value={id} />
            <div>
              <label htmlFor={`${uid}-ref`} className="text-xs font-semibold">
                Référence de la transaction (jamais de numéro de carte ni d&apos;IBAN)
              </label>
              <input
                id={`${uid}-ref`}
                name="paymentReference"
                defaultValue={payState.values?.paymentReference}
                className="field-input min-h-9 py-1 text-sm"
                maxLength={200}
                required
                aria-invalid={payState.fieldErrors?.paymentReference ? true : undefined}
              />
              {payState.fieldErrors?.paymentReference && (
                <p className="field-error text-xs">{payState.fieldErrors.paymentReference}</p>
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
                defaultValue={payState.values?.note}
                className="field-input py-1 text-sm"
              />
            </div>
            <label className="flex items-start gap-2 text-xs">
              <input type="checkbox" name="verified" className="mt-0.5 size-4 accent-ink" />
              <span>J&apos;ai vérifié la réception effective du paiement ({reference}).</span>
            </label>
            {payState.fieldErrors?.verified && <p className="field-error text-xs">{payState.fieldErrors.verified}</p>}
            <button type="submit" className="btn btn-dark min-h-9 w-full px-3 py-1 text-sm" disabled={payPending}>
              Confirmer l&apos;inscription
            </button>
            <Feedback state={payState} />
          </form>
        </details>
      )}
    </div>
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
