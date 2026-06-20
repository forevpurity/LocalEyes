import { useState } from "react";
import { cn } from "@/lib/utils";

// Shades are chosen per-hue so white text clears WCAG AA (>= 4.5:1) on every
// fill: the bright warm/cyan hues need -700, the rest pass at -600. These are
// fixed palette colors (not theme tokens), so they render identically in
// light and dark mode.
const AVATAR_COLORS = [
  "bg-red-600 text-white",
  "bg-orange-700 text-white",
  "bg-amber-700 text-white",
  "bg-lime-700 text-white",
  "bg-green-700 text-white",
  "bg-emerald-700 text-white",
  "bg-teal-700 text-white",
  "bg-cyan-700 text-white",
  "bg-sky-700 text-white",
  "bg-blue-600 text-white",
  "bg-indigo-600 text-white",
  "bg-violet-600 text-white",
  "bg-purple-600 text-white",
  "bg-fuchsia-600 text-white",
  "bg-pink-600 text-white",
  "bg-rose-600 text-white",
] as const;

const SIZE_CLASSES = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
} as const;

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % AVATAR_COLORS.length;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name ?? "Avatar"}
        onError={() => setImgError(true)}
        className={cn(
          "shrink-0 rounded-full object-cover bg-surface-container-low",
          SIZE_CLASSES[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        AVATAR_COLORS[name ? hashName(name) : 0],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {initials(name ?? null)}
    </span>
  );
}
