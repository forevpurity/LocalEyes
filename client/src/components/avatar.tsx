import { useState } from "react";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
} as const;

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
        "inline-flex shrink-0 items-center justify-center rounded-full bg-surface-container-low font-semibold text-muted-foreground",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {initials(name ?? null)}
    </span>
  );
}
