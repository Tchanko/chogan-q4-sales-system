import Link from "next/link";

/** Marque : carré cyan « Q4 » + nom du programme. */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="10" fill="#00D9FF" />
      <text
        x="20"
        y="24.5"
        textAnchor="middle"
        fill="#111111"
        fontSize="16"
        fontWeight="800"
        letterSpacing="-0.5"
        style={{ fontFamily: "var(--font-sora), sans-serif" }}
      >
        Q4
      </text>
      <rect x="11" y="29.5" width="18" height="2.6" rx="1.3" fill="#FFD400" />
    </svg>
  );
}

export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  const text = tone === "light" ? "text-paper" : "text-ink";
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 rounded-lg ${text}`}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[0.95rem] font-extrabold tracking-tight">CHOGAN Q4</span>{" "}
        <span className="mt-0.5 text-[0.68rem] font-bold tracking-[0.18em] opacity-80">SALES SYSTEM</span>
      </span>
      <span className="sr-only"> — accueil</span>
    </Link>
  );
}
