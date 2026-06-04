import "dotenv/config";
import { hashSync } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../client.js";
import { users, type UserRole } from "../schema/users.js";
import { users as seedData } from "./users.js";

interface SeedUser {
  email: string;
  password: string;
  displayName: string;
  role?: UserRole;
}

let created = 0;
let updated = 0;

for (const record of seedData as SeedUser[]) {
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

console.log(`Seed complete: ${created} created, ${updated} updated`);
process.exit(0);
