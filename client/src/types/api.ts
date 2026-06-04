export type Role = "citizen" | "staff" | "admin";

export type ReportStatus =
  | "submitted"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "closed"
  | "rejected";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  departmentId?: string | null;
  bannedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  status: ReportStatus;
  address: string | null;
  latitude: number;
  longitude: number;
  voteCount: number;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}
