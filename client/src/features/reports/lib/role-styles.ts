import type { Role } from "@/types/api";

export interface RoleStyle {
  bg: string;
  text: string;
  label: string;
}

/**
 * Only official roles get a badge; citizens render nothing.
 * Colors chosen to be distinct from the amber "Hidden" pill and the status pills.
 */
export const ROLE_BADGE_STYLES: Partial<Record<Role, RoleStyle>> = {
  staff: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    label: "Staff",
  },
  admin: {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-700 dark:text-violet-400",
    label: "Admin",
  },
};

export function getRoleBadge(role: Role | null | undefined): RoleStyle | null {
  return role ? (ROLE_BADGE_STYLES[role] ?? null) : null;
}
