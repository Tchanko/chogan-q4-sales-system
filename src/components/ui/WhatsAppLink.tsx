import type { ReactNode } from "react";
import { TrackedCta } from "@/components/analytics/Tracking";

export function ChatIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false" fill="none">
      <path
        d="M12 3.5a8.5 8.5 0 0 0-7.36 12.75L3.5 20.5l4.38-1.12A8.5 8.5 0 1 0 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8.5 10.5h7M8.5 13.5h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Lien vers une conversation WhatsApp (nouvel onglet), avec suivi du clic. */
export function WhatsAppLink({
  href,
  location,
  className,
  children,
}: {
  href: string;
  location: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <TrackedCta href={href} location={location} className={className}>
      <ChatIcon />
      <span>{children}</span>
      <span className="sr-only"> (ouvre WhatsApp dans un nouvel onglet)</span>
    </TrackedCta>
  );
}
