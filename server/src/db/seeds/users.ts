import { hashSync } from "bcryptjs";
import { db } from "../client.js";
import { users, type UserRole } from "../schema/users.js";
import type { SeedDepartment } from "./departments.js";

export const SHARED_PASSWORD = "password123";

const DAY = 86_400_000;

const citizenNames = [
  "Trần Văn Bình", "Nguyễn Thị Hương", "Lê Minh Quân", "Phạm Thu Hà", "Võ Quốc Bảo",
  "Đặng Ngọc Lan", "Bùi Anh Tuấn", "Đỗ Mỹ Linh", "Hồ Thanh Tâm", "Ngô Gia Hân",
];

export interface SeedUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  departmentId: string | null;
  bannedAt: Date | null;
  createdAt: Date;
}

export async function seedUsers(departments: SeedDepartment[], now: Date) {
  const departmentId = (name: string) => departments.find((item) => item.name === name)!.id;
  const daysAgo = (days: number) => new Date(now.getTime() - days * DAY);
  const records = [
    { email: "admin@localeyes.vn", displayName: "LocalEyes Admin", role: "admin" as const, createdAt: daysAgo(365) },
    { email: "staff.d1@localeyes.vn", displayName: "Nguyễn Đức Minh", role: "staff" as const, departmentId: departmentId("District 1"), createdAt: daysAgo(280) },
    { email: "staff.d1b@localeyes.vn", displayName: "Trần Thu Trang", role: "staff" as const, departmentId: departmentId("District 1"), createdAt: daysAgo(265) },
    { email: "staff.d3@localeyes.vn", displayName: "Lê Hoàng Nam", role: "staff" as const, departmentId: departmentId("District 3"), createdAt: daysAgo(250) },
    { email: "staff.d4@localeyes.vn", displayName: "Phạm Ngọc Mai", role: "staff" as const, departmentId: departmentId("District 4"), createdAt: daysAgo(235) },
    { email: "staff.binhthanh@localeyes.vn", displayName: "Võ Tuấn Kiệt", role: "staff" as const, departmentId: departmentId("Bình Thạnh"), createdAt: daysAgo(220) },
    { email: "staff.phunhuan@localeyes.vn", displayName: "Đặng Thị Yến", role: "staff" as const, departmentId: departmentId("Phú Nhuận"), createdAt: daysAgo(205) },
    ...citizenNames.map((displayName, index) => ({
      email: `citizen${index + 1}@localeyes.vn`, displayName, role: "citizen" as const,
      createdAt: daysAgo(180 + index * 7),
      bannedAt: index === 8 ? daysAgo(10) : undefined,
    })),
  ];
  const passwordHash = hashSync(SHARED_PASSWORD, 12);
  return db.insert(users).values(records.map((record) => ({
    ...record, passwordHash, mustChangePassword: false, avatarUrl: null,
    updatedAt: "bannedAt" in record && record.bannedAt ? record.bannedAt : record.createdAt,
  }))).returning({
    id: users.id, email: users.email, displayName: users.displayName, role: users.role,
    departmentId: users.departmentId, bannedAt: users.bannedAt, createdAt: users.createdAt,
  });
}
