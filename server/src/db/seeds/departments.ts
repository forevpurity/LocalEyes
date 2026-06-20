import { db } from "../client.js";
import { categories } from "../schema/categories.js";
import { departmentCategories } from "../schema/department-categories.js";
import { departments } from "../schema/departments.js";

const definitions = [
  { name: "District 1", active: true, bounds: [106.69, 10.765, 106.715, 10.79], categories: ["Pothole", "Graffiti", "Broken streetlight", "Trash", "Flooding"] },
  { name: "District 3", active: true, bounds: [106.68, 10.79, 106.705, 10.815], categories: ["Pothole", "Graffiti", "Broken streetlight", "Trash"] },
  { name: "District 4", active: true, bounds: [106.69, 10.74, 106.715, 10.765], categories: ["Pothole", "Broken streetlight", "Trash", "Flooding"] },
  { name: "Bình Thạnh", active: true, bounds: [106.715, 10.765, 106.745, 10.805], categories: ["Pothole", "Graffiti", "Broken streetlight", "Flooding"] },
  { name: "Phú Nhuận", active: false, bounds: [106.655, 10.785, 106.68, 10.815], categories: ["Pothole", "Trash"] },
] as const;

export type SeedDepartmentName = (typeof definitions)[number]["name"];

export interface SeedDepartment {
  id: string;
  name: SeedDepartmentName;
  isActive: boolean;
  categories: string[];
  bounds: readonly [number, number, number, number];
}

export async function seedDepartments(categoryRows: { id: string; name: string }[]) {
  const byName = new Map(categoryRows.map((category) => [category.name, category.id]));
  const result: SeedDepartment[] = [];

  for (const definition of definitions) {
    const [west, south, east, north] = definition.bounds;
    const [department] = await db.insert(departments).values({
      name: definition.name,
      isActive: definition.active,
      polygon: { coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]] },
    }).returning({ id: departments.id, name: departments.name, isActive: departments.isActive });
    if (!department) throw new Error(`Failed to insert ${definition.name}`);

    await db.insert(departmentCategories).values(definition.categories.map((name) => ({
      departmentId: department.id,
      categoryId: byName.get(name)!,
    })));
    result.push({ ...department, name: definition.name, categories: [...definition.categories], bounds: definition.bounds });
  }
  return result;
}

export async function seedCategoryRows() {
  return db.insert(categories).values([
    { name: "Pothole" },
    { name: "Graffiti" },
    { name: "Broken streetlight" },
    { name: "Trash" },
    { name: "Flooding" },
  ]).returning({ id: categories.id, name: categories.name });
}
