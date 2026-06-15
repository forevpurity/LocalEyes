export function formatResolution(hours: number | null): string {
  if (hours == null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} d`;
}
