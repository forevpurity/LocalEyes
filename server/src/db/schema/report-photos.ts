import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { reports } from "./reports.js";

export const PHOTO_KINDS = ["before", "after"] as const;
export type PhotoKind = (typeof PHOTO_KINDS)[number];

export const reportPhotos = pgTable("report_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  kind: text("kind").$type<PhotoKind>().notNull().default("before"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
