"use client";

import { openConsentPreferences } from "@/lib/analytics/consent";

export function ConsentPreferencesLink() {
  return (
    <button
      type="button"
      onClick={openConsentPreferences}
      className="underline-offset-4 hover:text-paper hover:underline"
    >
      Gérer les cookies
    </button>
  );
}
