import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { listCitizens, listCitizensDoc } from "./list-citizens.js";
import { ban, banDoc } from "./ban-citizen.js";
import { unban, unbanDoc } from "./unban-citizen.js";

export const citizensRouter = Router();

listCitizens(citizensRouter);
ban(citizensRouter);
unban(citizensRouter);

export const citizensPaths = {
  "/admin/citizens": {
    get: listCitizensDoc,
  },
  "/admin/citizens/{id}/ban": {
    post: banDoc,
  },
  "/admin/citizens/{id}/unban": {
    post: unbanDoc,
  },
} satisfies ZodOpenApiPathsObject;
