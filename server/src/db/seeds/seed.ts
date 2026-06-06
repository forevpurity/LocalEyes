import "dotenv/config";
import { hashSync } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../client.js";
import { users, type UserRole } from "../schema/users.js";
import { categories } from "../schema/categories.js";
import { users as seedUsers } from "./users.js";
import { categories as seedCategories } from "./categories.js";

interface SeedUser {
  email: string;
  password: string;
  displayName: string;
  role?: UserRole;
}

let created = 0;
let updated = 0;

for (const record of seedUsers as SeedUser[]) {
  const passwordHash = hashSync(record.password, 12);
  const role = record.role ?? "citizen";
  const displayName = record.displayName ?? record.email;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, record.email))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(users)
      .set({ passwordHash, displayName, role })
      .where(eq(users.email, record.email));
    updated++;
  } else {
    await db
      .insert(users)
      .values({ email: record.email, passwordHash, displayName, role });
    created++;
  }
}

console.log(`Users: ${created} created, ${updated} updated`);

let catCreated = 0;
for (const cat of seedCategories) {
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.name, cat.name))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(categories).values(cat);
    catCreated++;
  }
}
console.log(`Categories: ${catCreated} created`);

process.exit(0);
