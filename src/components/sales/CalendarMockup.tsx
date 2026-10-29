/** Illustration décorative du calendrier éditorial (aucune donnée réelle). */
const days = [
  { day: "Lun", label: "Vidéo produit", tag: "Reel" },
  { day: "Mar", label: "Conseil parfum", tag: "Carrousel" },
  { day: "Mer", label: "Sondage", tag: "Story" },
  { day: "Jeu", label: "Vidéo IA sans visage", tag: "TikTok" },
  { day: "Ven", label: "Avant / après", tag: "Post" },
  { day: "Sam", label: "Questions fréquentes", tag: "Live" },
];

export function CalendarMockup() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md select-none">
      <div className="absolute -inset-6 rounded-[2rem] bg-cyan/10 blur-2xl" />
      <div className="relative rounded-3xl border border-white/10 bg-ink-2 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="font-display text-sm font-bold text-paper">Calendrier éditorial</p>
          <span className="rounded-full bg-yellow px-2.5 py-0.5 text-xs font-bold text-ink">Semaine 1</span>
        </div>
        <ul className="mt-4 space-y-2">
          {days.map((d, i) => (
            <li
              key={d.day}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                i === 3 ? "bg-cyan text-ink" : "bg-ink-3 text-paper"
              }`}
            >
              <span className={`w-9 text-xs font-bold ${i === 3 ? "text-ink" : "text-muted-dark"}`}>{d.day}</span>
              <span className="flex-1 text-sm font-semibold">{d.label}</span>
              <span
                className={`rounded-md px-2 py-0.5 text-[0.7rem] font-bold ${
                  i === 3 ? "bg-ink text-cyan" : "bg-white/10 text-muted-dark"
                }`}
              >
                {d.tag}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
