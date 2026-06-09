import { sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { departments } from "../db/schema/departments.js";
import { departmentCategories } from "../db/schema/department-categories.js";
import { categories } from "../db/schema/categories.js";
import { eq } from "drizzle-orm";

export interface CoveringResult {
  department: { id: string; name: string } | null;
  categories: { id: string; name: string }[];
}

export async function getCoveringDepartment(
  lat: number,
  lng: number,
): Promise<CoveringResult> {
  const point = `SRID=4326;POINT(${lng} ${lat})`;

  const [dept] = await db
    .select({ id: departments.id, name: departments.name })
    .from(departments)
    .where(
      sql`ST_Contains(${departments.polygon}, ${sql.raw(`'${point}'::geometry`)}) AND ${departments.isActive} = true`,
    )
    .limit(1);

  if (dept) {
    const deptCats = await db
      .select({ id: categories.id, name: categories.name })
      .from(departmentCategories)
      .innerJoin(categories, eq(departmentCategories.categoryId, categories.id))
      .where(eq(departmentCategories.departmentId, dept.id));

    return { department: dept, categories: deptCats };
  }

  const allCats = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories);

  return { department: null, categories: allCats };
}