import { EyeOff, Lock } from "lucide-react";

interface ReportFlagBadgesProps {
  isHidden?: boolean;
  isLocked?: boolean;
  /** Tailwind text-size utility for the badge label. */
  size?: "xs" | "sm";
  /** When true, render only the icon (no label) to save horizontal space. */
  iconOnly?: boolean;
}

/**
 * Moderation-state badges shown to owners/moderators next to a report's status.
 * Hidden reports are excluded from the public map; locked reports reject new
 * comments and owner edits. The list/detail APIs already return both flags.
 */
export function ReportFlagBadges({
  isHidden,
  isLocked,
  size = "xs",
  iconOnly = false,
}: ReportFlagBadgesProps) {
  if (!isHidden && !isLocked) return null;

  const text = size === "sm" ? "text-[11px]" : "text-[10px]";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-2.5 w-2.5";
  const pad = iconOnly ? "p-1" : "px-2 py-0.5";

  return (
    <>
      {isHidden && (
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-50 font-medium text-amber-700 ${pad} ${text}`}
          title="Hidden by a moderator — not shown on the public map"
          aria-label={iconOnly ? "Hidden" : undefined}
        >
          <EyeOff className={iconSize} aria-hidden="true" />
          {!iconOnly && "Hidden"}
        </span>
      )}
      {isLocked && (
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-zinc-300 bg-zinc-100 font-medium text-zinc-600 ${pad} ${text}`}
          title="Locked by a moderator — new comments and edits are disabled"
          aria-label={iconOnly ? "Locked" : undefined}
        >
          <Lock className={iconSize} aria-hidden="true" />
          {!iconOnly && "Locked"}
        </span>
      )}
    </>
  );
}
