import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { createDepartment, createDepartmentDoc } from "./create-department.js";
import { listDepartments, listDepartmentsDoc } from "./list-departments.js";

export const departmentsRouter = Router();

createDepartment(departmentsRouter);
listDepartments(departmentsRouter);

export const departmentsPaths = {
  "/departments": {
    post: createDepartmentDoc,
    get: listDepartmentsDoc,
  },
} satisfies ZodOpenApiPathsObject;
