import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, pool } from "../client.js";
import { runSeedChecks } from "./checks.js";
import { seedCategoryRows, seedDepartments } from "./departments.js";
import { createRng } from "./lib/rng.js";
import { seedPhotos } from "./photos.js";
import { seedReports } from "./reports.js";
import { seedUsers, SHARED_PASSWORD } from "./users.js";

if (process.env.NODE_ENV === "production" && process.env.SEED_RESET !== "true") {
  throw new Error("Refusing to run destructive demo seed in production. Set SEED_RESET=true to explicitly allow it.");
}

const now = new Date();
const rng = createRng(0x4c4f4341);

try {
  console.log("Resetting demo data...");
  await db.execute(sql`TRUNCATE TABLE categories, departments, users, reports RESTART IDENTITY CASCADE`);

  const categoryRows = await seedCategoryRows();
  const departmentRows = await seedDepartments(categoryRows);
  // Routing uses the module-level connection, so geography must be committed before reports.
  const userRows = await seedUsers(departmentRows, now);
  const reportRows = await seedReports({ now, rng, departments: departmentRows, categoryRows, userRows });
  const photoCount = await seedPhotos(reportRows);
  await runSeedChecks({ now, reports: reportRows, departments: departmentRows, users: userRows });

  console.log(`Seeded ${categoryRows.length} categories, ${departmentRows.length} departments, ${userRows.length} users, ${reportRows.length} reports, and ${photoCount} report photos.`);
  console.log(`Hero accounts: admin@localeyes.vn, staff.d1@localeyes.vn, citizen1@localeyes.vn`);
  console.log(`Shared password: ${SHARED_PASSWORD}`);
  console.log("Seed self-checks passed.");
} finally {
  await pool.end();
}
