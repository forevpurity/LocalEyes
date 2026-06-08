import { pgTable, uuid, text, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { polygonGeometry } from "../types.js";

export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  polygon: polygonGeometry("polygon").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => ({
  polygonIdx: index("idx_departments_polygon").using("gist", t.polygon),
}));
