import type { Category } from "@/types/api";

const ICON_MAP: Record<string, string> = {
  pothole: "🕳️",
  graffiti: "🎨",
  "broken light": "💡",
  "broken streetlight": "💡",
  trash: "🗑️",
  flooding: "💧",
};

export function getCategoryIcon(category: Category): string {
  const key = category.name.toLowerCase();
  return ICON_MAP[key] ?? "📌";
}
