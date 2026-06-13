export type Role = "citizen" | "staff" | "admin";

export type ReportStatus =
  | "submitted"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "closed"
  | "rejected"
  | "withdrawn";

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

export interface Category {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  polygon: { coordinates: [number, number][][] };
  isActive: boolean;
  categories: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportPhoto {
  url: string;
  order: number;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  status: ReportStatus;
  address: string | null;
  latitude: number;
  longitude: number;
  photos: ReportPhoto[];
  voteCount: number;
  hasVoted: boolean;
  isHidden: boolean;
  isLocked: boolean;
  createdAt: string;
  departmentId: string | null;
  departmentName: string | null;
  citizenName: string | null;
}

export interface ReportDetail extends Report {
  isOwner: boolean;
  isSubscribed: boolean;
  allowedTransitions: ReportStatus[];
  comments: Comment[];
}

export type CommentType = "discussion" | "status_note";

export interface Comment {
  id: string;
  type: CommentType;
  body: string | null;
  newStatus: string | null;
  authorName: string | null;
  isMine: boolean;
  isHidden: boolean;
  isEdited: boolean;
  createdAt: string;
}

export interface ListReportsResponse {
  items: Report[];
  nextCursor?: string | null;
  hasMore?: boolean;
}

export interface CoveringResponse {
  department: { id: string; name: string } | null;
  categories: Category[];
}

export type NotificationType =
  | "status_change"
  | "new_comment"
  | "report_locked"
  | "report_hidden";

export interface Notification {
  id: string;
  recipientId: string;
  reportId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ListNotificationsResponse {
  items: Notification[];
  nextCursor: string | null;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkAllReadResponse {
  count: number;
}

export interface StaffListItem {
  id: string;
  email: string;
  displayName: string;
  departmentId: string | null;
  departmentName: string | null;
  bannedAt: string | null;
  createdAt: string;
}

export interface CitizenListItem {
  id: string;
  email: string;
  displayName: string;
  bannedAt: string | null;
  createdAt: string;
}

export interface ListStaffResponse {
  items: StaffListItem[];
  nextCursor: string | null;
}

export interface ListCitizensResponse {
  items: CitizenListItem[];
  nextCursor: string | null;
}

export interface ToggleBanResponse {
  banned: boolean;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}
