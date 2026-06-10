import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import { departments } from "../../db/schema/departments.js";
import { ConflictError, NotFoundError, errorResponseSchema } from "../../common/errors.js";
import { parseAndValidate } from "../../common/validate.js";
import { authenticate } from "../../common/auth.js";
import { zEmail } from "../../common/schemas.js";
import { staffListItem } from "./schemas.js";

const createStaffSchema = z
  .object({
    email: zEmail(),
    password: z.string().min(8),
    displayName: z.string().min(2).max(50),
    departmentId: z.uuid(),
  })
  .meta({ id: "CreateStaffRequest" });

export const createStaffDoc = {
  summary: "Create a staff account",
  tags: ["Staff"],
  operationId: "createStaff",
  requestBody: {
    content: {
      "application/json": { schema: createStaffSchema },
    },
  },
  responses: {
    201: {
      description: "Staff account created",
      content: {
        "application/json": { schema: staffListItem },
      },
    },
    400: {
      description: "Validation failed",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    404: {
      description: "Department not found",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    409: {
      description: "Email already registered",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function createStaff(router: Router) {
  router.post("/", authenticate("admin"), async (req, res) => {
    const { email, password, displayName, departmentId } = parseAndValidate(
      createStaffSchema,
      req.body,
    );

    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, departmentId),
      columns: { id: true, name: true },
    });
    if (!dept) {
      throw new NotFoundError("Department not found");
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true },
    });
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        displayName,
        role: "staff",
        departmentId,
        mustChangePassword: true,
      })
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        departmentId: users.departmentId,
        bannedAt: users.bannedAt,
        createdAt: users.createdAt,
      });

    res.status(201).json({
      ...user,
      departmentName: dept.name,
      bannedAt: user.bannedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    });
  });
}
