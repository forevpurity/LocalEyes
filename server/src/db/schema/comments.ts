import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { reports, type ReportStatus } from "./reports.js";
import { users } from "./users.js";

export const COMMENT_TYPES = ["discussion", "status_note"] as const;
export type CommentType = (typeof COMMENT_TYPES)[number];

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  type: text("type").$type<CommentType>().notNull().default("discussion"),
  newStatus: text("new_status").$type<ReportStatus>(),
  isHidden: boolean("is_hidden").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull().$onUpdate(() => new Date()),
});
