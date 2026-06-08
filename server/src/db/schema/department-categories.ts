import { pgTable, uuid, primaryKey } from "drizzle-orm/pg-core";
import { departments } from "./departments.js";
import { categories } from "./categories.js";

export const departmentCategories = pgTable("department_categories", {
  departmentId: uuid("department_id").notNull().references(() => departments.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
}, (t) => [
  primaryKey({ columns: [t.departmentId, t.categoryId] }),
]);
