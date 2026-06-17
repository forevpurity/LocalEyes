import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { createStaff, createStaffDoc } from "./create-staff.js";
import { listStaff, listStaffDoc } from "./list-staff.js";
import { ban, banDoc } from "./ban-staff.js";
import { unban, unbanDoc } from "./unban-staff.js";

export const staffRouter = Router();

createStaff(staffRouter);
listStaff(staffRouter);
ban(staffRouter);
unban(staffRouter);

export const staffPaths = {
  "/admin/staff": {
    post: createStaffDoc,
    get: listStaffDoc,
  },
  "/admin/staff/{id}/ban": {
    post: banDoc,
  },
  "/admin/staff/{id}/unban": {
    post: unbanDoc,
  },
} satisfies ZodOpenApiPathsObject;
