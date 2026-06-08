import { pgTable, uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { reports } from "./reports.js";
import { users } from "./users.js";

export const subscriptions = pgTable("subscriptions", {
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  citizenId: uuid("citizen_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.reportId, t.citizenId] }),
]);
