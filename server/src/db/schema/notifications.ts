import { index, pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { reports } from "./reports.js";
import { users } from "./users.js";

export const NOTIFICATION_TYPES = ["status_change", "new_comment", "report_locked", "report_hidden"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipientId: uuid("recipient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  type: text("type").$type<NotificationType>().notNull(),
  title: text("title").notNull(),
  body: text("body"),
  readAt: timestamp("read_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (t) => [
  index("idx_notifications_recipient_created_id").on(t.recipientId, t.createdAt.desc(), t.id.desc()),
]);
