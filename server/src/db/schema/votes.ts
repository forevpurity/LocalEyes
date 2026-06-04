import { pgTable, uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { reports } from "./reports.js";
import { users } from "./users.js";

export const votes = pgTable("votes", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  citizenId: uuid("citizen_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (t) => ({
  uniqueVote: uniqueIndex("votes_report_citizen_unique").on(t.reportId, t.citizenId),
}));
