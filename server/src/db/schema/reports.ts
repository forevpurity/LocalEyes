import { pgTable, uuid, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { pointGeometry } from "../types.js";
import { categories } from "./categories.js";
import { departments } from "./departments.js";
import { users } from "./users.js";

export const REPORT_STATUSES = ["submitted", "acknowledged", "in_progress", "resolved", "closed", "rejected"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: pointGeometry("location").notNull(),
  address: text("address"),
  status: text("status").$type<ReportStatus>().notNull().default("submitted"),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
  departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
  citizenId: uuid("citizen_id").notNull().references(() => users.id, { onDelete: "set null" }),
  isHidden: boolean("is_hidden").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => ({
  locationIdx: index("idx_reports_location").using("gist", t.location),
}));
