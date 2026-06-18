import "dotenv/config";
import { eq, like, inArray } from "drizzle-orm";
import { db } from "../client.js";
import { reports } from "../schema/reports.js";
import { comments } from "../schema/comments.js";
import { users } from "../schema/users.js";
import { categories } from "../schema/categories.js";

// Populates the staff member's OWN department across both the current (0–30d)
// and prior (30–60d) windows so the staff dashboard trend pills
// ("Resolved (30d)" / "Avg. resolution (30d)") have a baseline and stop
// showing "— vs last month". Idempotent: re-running first deletes its own rows.
const TAG = "[staff-trend-seed]";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const location = { lng: 106.700981, lat: 10.776889 }; // Ho Chi Minh City

// Attach everything to a real staff member's department so it shows on their
// dashboard. Falls back gracefully if there is no staff or category yet.
const [staff] = await db
  .select({ id: users.id, departmentId: users.departmentId })
  .from(users)
  .where(eq(users.role, "staff"))
  .limit(1);
const [citizen] = await db
  .select({ id: users.id })
  .from(users)
  .where(eq(users.role, "citizen"))
  .limit(1);
const [category] = await db.select({ id: categories.id }).from(categories).limit(1);

if (!staff?.departmentId || !category) {
  console.error(
    "Need a staff user with a department and at least one category. Run db:seed and create a staff user first.",
  );
  process.exit(1);
}

const departmentId = staff.departmentId;
const citizenId = citizen?.id ?? null;

// Clean up any previous rows from this seed (cascades to their comments).
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

interface SeedReport {
  title: string;
  createdDaysAgo: number;
  /** Days after creation it was marked resolved; omit to leave it open. */
  resolveAfterDays?: number;
  /** Status for open reports (drives the snapshot cards). */
  openStatus?: "submitted" | "acknowledged" | "in_progress";
}

// Prior window (~45d ago): 2 resolved with a SLOW ~3-day resolution time, so the
// current window can show a favorable (faster) trend.
const priorReports: SeedReport[] = [
  { title: "Prior resolved A", createdDaysAgo: 45, resolveAfterDays: 3 },
  { title: "Prior resolved B", createdDaysAgo: 45, resolveAfterDays: 3 },
  { title: "Prior open A", createdDaysAgo: 45, openStatus: "submitted" },
];

// Current window (~10d ago): 5 resolved with a FAST ~1-day resolution time
// (=> resolved count ▲150%, avg resolution ▼ which is favorable/green), plus a
// few open ones to populate "Open reports" / "Awaiting review".
const currentReports: SeedReport[] = [
  { title: "Recent resolved 1", createdDaysAgo: 10, resolveAfterDays: 1 },
  { title: "Recent resolved 2", createdDaysAgo: 10, resolveAfterDays: 1 },
  { title: "Recent resolved 3", createdDaysAgo: 9, resolveAfterDays: 1 },
  { title: "Recent resolved 4", createdDaysAgo: 8, resolveAfterDays: 1 },
  { title: "Recent resolved 5", createdDaysAgo: 7, resolveAfterDays: 1 },
  { title: "Recent awaiting review 1", createdDaysAgo: 5, openStatus: "submitted" },
  { title: "Recent awaiting review 2", createdDaysAgo: 3, openStatus: "submitted" },
  { title: "Recent in progress 1", createdDaysAgo: 2, openStatus: "in_progress" },
];

let resolvedTotal = 0;
for (const r of [...priorReports, ...currentReports]) {
  const createdAt = daysAgo(r.createdDaysAgo);
  const resolved = r.resolveAfterDays != null;
  const [inserted] = await db
    .insert(reports)
    .values({
      title: `${TAG} ${r.title}`,
      description: "Seeded report for staff dashboard trend verification.",
      location,
      address: "Seeded address",
      status: resolved ? "resolved" : r.openStatus ?? "submitted",
      categoryId: category.id,
      departmentId,
      citizenId,
      createdAt,
      updatedAt: createdAt,
    })
    .returning({ id: reports.id });

  if (resolved && inserted) {
    const resolvedAt = daysAgo(r.createdDaysAgo - (r.resolveAfterDays ?? 1));
    await db.insert(comments).values({
      reportId: inserted.id,
      authorId: citizenId ?? staff.id,
      body: "Marked resolved (seed).",
      type: "status_note",
      newStatus: "resolved",
      createdAt: resolvedAt,
      updatedAt: resolvedAt,
    });
    resolvedTotal++;
  }
}

console.log(
  `Inserted ${priorReports.length + currentReports.length} reports (${resolvedTotal} resolved) for department ${departmentId}, tagged ${TAG}.`,
);
process.exit(0);
