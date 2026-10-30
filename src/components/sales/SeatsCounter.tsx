import { seatsLabel, type CohortAvailability } from "@/lib/enrollment";

/**
 * Places restantes de la session ouverte, calculées à partir des inscriptions
 * confirmées enregistrées (jamais d'estimation). Rien n'est affiché si le
 * comptage est indisponible.
 */
export function SeatsCounter({
  availability,
  tone = "light",
  className = "",
}: {
  availability: CohortAvailability;
  tone?: "light" | "dark";
  className?: string;
}) {
  const label = seatsLabel(availability);
  if (!label || availability.remaining === null) return null;
  const taken = availability.capacity - availability.remaining;
  return (
    <div className={className} data-testid="seats-counter" data-remaining={availability.remaining}>
      <p className="font-bold">{label}</p>
      <div aria-hidden="true" className="mt-2 flex max-w-xs gap-1">
        {Array.from({ length: availability.capacity }, (_, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-full ${
              i < taken ? (tone === "dark" ? "bg-white/20" : "bg-line") : tone === "dark" ? "bg-cyan" : "bg-cyan-ink"
            }`}
          />
        ))}
      </div>
      <p className={`mt-1.5 text-xs ${tone === "dark" ? "text-muted-dark" : "text-muted"}`}>
        Calculé à partir des inscriptions confirmées (paiement vérifié).
      </p>
    </div>
  );
}
