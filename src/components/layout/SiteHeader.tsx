import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";

/** En-tête volontairement minimal : pas de menu qui détournerait du parcours. */
export function SiteHeader({ action }: { action?: ReactNode }) {
  return (
    <header className="bg-ink text-paper">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo tone="light" />
        {action}
      </div>
    </header>
  );
}
