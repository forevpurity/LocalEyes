import type { ReportStatus } from "@/types/api";

export interface StatusStyle {
  bg: string;
  text: string;
  label: string;
}

export const STATUS_STYLES: Record<ReportStatus, StatusStyle> = {
  submitted: { bg: "bg-primary/10", text: "text-primary", label: "Submitted" },
  acknowledged: {
    bg: "bg-violet-50",
    text: "text-violet-800",
    label: "Acknowledged",
  },
  in_progress: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    label: "In Progress",
  },
  resolved: { bg: "bg-green-50", text: "text-green-800", label: "Resolved" },
  closed: { bg: "bg-gray-100", text: "text-gray-600", label: "Closed" },
  rejected: { bg: "bg-red-50", text: "text-red-800", label: "Rejected" },
  withdrawn: { bg: "bg-gray-100", text: "text-gray-500", label: "Withdrawn" },
};

/** Solid hex colors used for map markers and timeline dots. */
export const STATUS_COLORS: Record<ReportStatus, string> = {
  submitted: "#3b82f6",
  acknowledged: "#8b5cf6",
  in_progress: "#f59e0b",
  resolved: "#10b981",
  closed: "#6b7280",
  rejected: "#ef4444",
  withdrawn: "#9ca3af",
};

export function getStatusStyle(status: string): StatusStyle {
  return STATUS_STYLES[status as ReportStatus] ?? STATUS_STYLES.submitted;
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status as ReportStatus] ?? "#6b7280";
}
