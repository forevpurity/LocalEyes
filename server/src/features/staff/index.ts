import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { createStaff, createStaffDoc } from "./create-staff.js";
import { listStaff, listStaffDoc } from "./list-staff.js";
import { toggleBan, toggleBanDoc } from "./toggle-ban.js";

export const staffRouter = Router();

createStaff(staffRouter);
listStaff(staffRouter);
toggleBan(staffRouter);

export const staffPaths = {
  "/admin/staff": {
    post: createStaffDoc,
    get: listStaffDoc,
  },
  "/admin/staff/{id}/ban": {
    patch: toggleBanDoc,
  },
} satisfies ZodOpenApiPathsObject;
