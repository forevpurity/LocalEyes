import { z } from "zod";

export const coordinatePair = z
  .tuple([z.number(), z.number()])
  .meta({ description: "[longitude, latitude]" });

export const polygonSchema = z
  .object({
    coordinates: z
      .tuple([
        z
          .array(coordinatePair)
          .min(4, "Polygon ring must have at least 4 coordinate pairs (3 unique + closing)")
          .max(1000, "Polygon ring must have at most 1000 coordinate pairs")
          .refine(
            (ring) => {
              const first = ring[0];
              const last = ring[ring.length - 1];
              return first[0] === last[0] && first[1] === last[1];
            },
            { message: "Polygon ring must be closed (first and last coordinates must match)" },
          ),
      ])
      .meta({ description: "Outer ring only. Interior rings are not allowed." }),
  })
  .refine(
    (p) => {
      const ring = p.coordinates[0];
      if (ring.length < 4) return true;
      let area = 0;
      for (let i = 0; i < ring.length - 1; i++) {
        area += ring[i][0] * ring[i + 1][1];
        area -= ring[i + 1][0] * ring[i][1];
      }
      return Math.abs(area / 2) > 0;
    },
    { message: "Polygon must have non-zero area" },
  )
  .transform((p) => p.coordinates[0]);

export const departmentCategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

export const departmentResponse = z
  .object({
    id: z.uuid(),
    name: z.string(),
    polygon: z.object({ coordinates: z.array(z.array(coordinatePair)) }),
    categories: z.array(departmentCategorySchema),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ id: "DepartmentResponse" });
