import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { departments } from "./departments.js";

export const USER_ROLES = ["citizen", "staff", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").$type<UserRole>().notNull().default("citizen"),
  departmentId: uuid("department_id").references(() => departments.id, { onDelete: "restrict" }),
  mustChangePassword: boolean("must_change_password").default(false).notNull(),
  bannedAt: timestamp("banned_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  avatarUrl: text("avatar_url"),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull().$onUpdate(() => new Date()),
});
