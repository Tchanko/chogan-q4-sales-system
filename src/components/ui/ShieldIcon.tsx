/** Bouclier avec validation (SVG en ligne, comme les autres icônes du site). */
export function ShieldIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false" fill="none">
      <path
        d="M12 2.75 4.5 5.6v5.9c0 4.6 3.1 8.6 7.5 9.75 4.4-1.15 7.5-5.15 7.5-9.75V5.6L12 2.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m8.75 12.2 2.3 2.3 4.2-4.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
