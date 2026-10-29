/**
 * Signaux anti-robots simples et sans service externe :
 * - champ piège invisible (« honeypot ») qui doit rester vide ;
 * - délai minimal entre l'affichage du formulaire et l'envoi, mesuré par le
 *   navigateur (performance.now), donc insensible au décalage d'horloge.
 * Ces signaux s'ajoutent à la limitation de débit et au contrôle d'origine.
 */

export const MIN_FILL_TIME_MS = 2500;

export type BotCheck = "ok" | "honeypot" | "too_fast";

export function checkHumanSignals(meta: { hp?: string; elapsedMs: number }): BotCheck {
  if (meta.hp && meta.hp.trim() !== "") return "honeypot";
  if (meta.elapsedMs < MIN_FILL_TIME_MS) return "too_fast";
  return "ok";
}
