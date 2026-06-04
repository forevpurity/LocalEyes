import { customType } from "drizzle-orm/pg-core";

export const pointGeometry = customType<{
  data: unknown;
  driverData: unknown;
}>({
  dataType() {
    return "geometry(Point, 4326)";
  },
});

export const polygonGeometry = customType<{
  data: unknown;
  driverData: unknown;
}>({
  dataType() {
    return "geometry(Polygon, 4326)";
  },
});
