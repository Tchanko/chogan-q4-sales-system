"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/forms/fields";
import { loginAction, type ActionState } from "../actions";

const initial: ActionState = { ok: false, message: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="admin-password" className="field-label">
          Mot de passe
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field-input"
          aria-invalid={state.message ? true : undefined}
        />
      </div>
      <FormAlert message={state.message} />
      <button type="submit" className="btn btn-dark w-full" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
