import "dotenv/config";
import { eq, like, inArray } from "drizzle-orm";
import { db } from "../client.js";
import { reports } from "../schema/reports.js";
import { comments } from "../schema/comments.js";
import { users } from "../schema/users.js";
import { categories } from "../schema/categories.js";
import { departments } from "../schema/departments.js";

// One-off helper to populate the PRIOR 30–60 day window so the admin dashboard
// trend pills (current 30d vs prior 30d) have a baseline to compare against.
// Idempotent: re-running first deletes anything tagged with TAG.
const TAG = "[trend-seed]";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// pick the first citizen, category, and (optionally) a department to attach to
const [citizen] = await db
  .select({ id: users.id })
  .from(users)
  .where(eq(users.role, "citizen"))
  .limit(1);
const [category] = await db.select({ id: categories.id }).from(categories).limit(1);
const deptRows = await db.select({ id: departments.id }).from(departments).limit(2);

if (!citizen || !category) {
  console.error("Need at least one citizen and one category. Run db:seed first.");
  process.exit(1);
}

const location = { lng: 106.700981, lat: 10.776889 }; // Ho Chi Minh City

// Clean up any previous trend-seed rows (cascades to their comments)
const existing = await db
  .select({ id: reports.id })
  .from(reports)
  .where(like(reports.title, `${TAG}%`));
if (existing.length > 0) {
  await db.delete(reports).where(
    inArray(reports.id, existing.map((r) => r.id)),
  );
  console.log(`Removed ${existing.length} previous ${TAG} reports.`);
}

// Prior-window dataset: 6 reports created ~45 days ago.
// 2 of them get resolved (status_note) ~43 days ago so the prior window also has
// a resolution rate and an avg-resolution baseline.
const priorReports = [
  { title: "Prior pothole on Main St", resolveAfterDays: 2 },
  { title: "Prior broken streetlight", resolveAfterDays: 1 },
  { title: "Prior overflowing bin" },
  { title: "Prior graffiti on wall" },
  { title: "Prior fallen tree branch" },
  { title: "Prior blocked drain" },
];

let resolvedCount = 0;
for (let i = 0; i < priorReports.length; i++) {
  const r = priorReports[i];
  const createdAt = daysAgo(45);
  const resolved = r.resolveAfterDays != null;
  const [inserted] = await db
    .insert(reports)
    .values({
      title: `${TAG} ${r.title}`,
      description: "Seeded report for dashboard trend verification.",
      location,
      address: "Seeded address",
      status: resolved ? "resolved" : "submitted",
      categoryId: category.id,
      // spread across available departments (and leave some unassigned)
      departmentId: i % 3 === 0 ? null : deptRows[i % deptRows.length]?.id ?? null,
      citizenId: citizen.id,
      createdAt,
      updatedAt: createdAt,
    })
    .returning({ id: reports.id });

  if (resolved && inserted) {
    const resolvedAt = daysAgo(45 - (r.resolveAfterDays ?? 1));
    await db.insert(comments).values({
      reportId: inserted.id,
      authorId: citizen.id,
      body: "Marked resolved (seed).",
      type: "status_note",
      newStatus: "resolved",
      createdAt: resolvedAt,
      updatedAt: resolvedAt,
    });
    resolvedCount++;
  }
}

console.log(
  `Inserted ${priorReports.length} prior-window reports (${resolvedCount} resolved) tagged ${TAG}.`,
);
process.exit(0);
