import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { listCitizens, listCitizensDoc } from "./list-citizens.js";
import { toggleBan, toggleBanDoc } from "./toggle-ban.js";

export const citizensRouter = Router();

listCitizens(citizensRouter);
toggleBan(citizensRouter);

export const citizensPaths = {
  "/admin/citizens": {
    get: listCitizensDoc,
  },
  "/admin/citizens/{id}/ban": {
    patch: toggleBanDoc,
  },
} satisfies ZodOpenApiPathsObject;
