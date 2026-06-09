import { Router } from "express";
import { z } from "zod";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { ValidationError } from "../../common/errors.js";
import { errorResponseSchema } from "../../common/errors.js";
import { parseAndValidate } from "../../common/validate.js";
import { getCoveringDepartment } from "../../common/geo.js";
import { departmentCategorySchema } from "./schemas.js";

const coveringQuerySchema = z
  .object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  })
  .meta({ id: "CoveringQuery" });

const coveringResponse = z
  .object({
    department: z
      .object({
        id: z.uuid(),
        name: z.string(),
      })
      .nullable(),
    categories: z.array(departmentCategorySchema),
  })
  .meta({ id: "CoveringResponse" });

export const getCoveringDoc = {
  summary: "Get the department covering a point",
  description:
    "Returns the active department whose polygon contains the given point, along with its categories. If no department covers the point, returns all categories (Unassigned).",
  tags: ["Departments"],
  operationId: "getCoveringDepartment",
  requestParams: {
    query: coveringQuerySchema,
  },
  responses: {
    200: {
      description: "Covering department and categories",
      content: {
        "application/json": { schema: coveringResponse },
      },
    },
    400: {
      description: "Invalid coordinates",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function getCovering(router: Router) {
  router.get("/covering", async (req, res) => {
    const { lat, lng } = parseAndValidate(coveringQuerySchema, req.query);

    const result = await getCoveringDepartment(lat, lng);

    res.json(result);
  });
}