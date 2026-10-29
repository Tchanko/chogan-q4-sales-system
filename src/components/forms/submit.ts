"use client";

import { useCallback, useEffect, useRef } from "react";
import { getAttribution } from "@/lib/analytics/attribution";
import type { FieldErrors } from "@/lib/validation/schemas";

export interface SubmitResponse<T> {
  ok: boolean;
  status: number;
  data: (T & { ok?: boolean; message?: string; fieldErrors?: FieldErrors }) | null;
}

export const NETWORK_ERROR =
  "Connexion impossible. Vérifie ta connexion internet puis réessaie : ta demande n'a pas été enregistrée.";

/**
 * Envoie un formulaire en JSON. `ok` n'est vrai que si le serveur confirme
 * explicitement l'enregistrement ({ ok: true } avec un statut 2xx).
 */
export async function postJson<T>(url: string, body: unknown): Promise<SubmitResponse<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    let data: SubmitResponse<T>["data"] = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { ok: res.ok && data?.ok === true, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

/** Mesure le temps de remplissage (signal anti-robots) et joint l'attribution. */
export function useSubmissionMeta() {
  const mountedAt = useRef<number | null>(null);
  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);
  return useCallback(
    (hp: string) => ({
      hp,
      elapsedMs: mountedAt.current === null ? 0 : Math.round(performance.now() - mountedAt.current),
      attribution: getAttribution(),
    }),
    [],
  );
}

/** Place le focus sur le premier champ en erreur après un envoi refusé. */
export function focusFirstError(form: HTMLFormElement | null) {
  window.requestAnimationFrame(() => {
    const target = form?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"] input');
    target?.focus();
  });
}
