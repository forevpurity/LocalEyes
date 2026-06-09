import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { getCovering, getCoveringDoc } from "./get-covering.js";
import { createDepartment, createDepartmentDoc } from "./create-department.js";
import { listDepartments, listDepartmentsDoc } from "./list-departments.js";
import { getDepartment, getDepartmentDoc } from "./get-department.js";
import { updateDepartment, updateDepartmentDoc } from "./update-department.js";

export const departmentsRouter = Router();

getCovering(departmentsRouter);
createDepartment(departmentsRouter);
listDepartments(departmentsRouter);
getDepartment(departmentsRouter);
updateDepartment(departmentsRouter);

export const departmentsPaths = {
  "/departments/covering": {
    get: getCoveringDoc,
  },
  "/departments": {
    post: createDepartmentDoc,
    get: listDepartmentsDoc,
  },
  "/departments/{id}": {
    get: getDepartmentDoc,
    patch: updateDepartmentDoc,
  },
} satisfies ZodOpenApiPathsObject;