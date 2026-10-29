export function CheckIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.18" />
      <path d="m6 10.2 2.6 2.6L14.2 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckList({
  items,
  tone = "light",
  className = "",
}: {
  items: readonly string[];
  tone?: "light" | "dark";
  className?: string;
}) {
  const icon = tone === "dark" ? "text-cyan" : "text-cyan-ink";
  return (
    <ul className={`space-y-3 ${className}`}>
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <CheckIcon className={`mt-0.5 size-5 shrink-0 ${icon}`} />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}
