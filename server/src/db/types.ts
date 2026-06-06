import { customType } from "drizzle-orm/pg-core";
import { Geometry, Point as WkxPoint, Polygon as WkxPolygon } from "wkx";

export interface Point {
  lng: number;
  lat: number;
}

export interface Polygon {
  coordinates: [number, number][][];
}

export const pointGeometry = customType<{
  data: Point;
  driverData: string;
}>({
  dataType() {
    return "geometry(Point, 4326)";
  },
  toDriver(value: Point) {
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
  fromDriver(value: string): Point {
    const buf = Buffer.from(value, "hex");
    const geom = Geometry.parse(buf) as WkxPoint;
    return { lng: geom.x, lat: geom.y };
  },
});

export const polygonGeometry = customType<{
  data: Polygon;
  driverData: string;
}>({
  dataType() {
    return "geometry(Polygon, 4326)";
  },
  toDriver(value: Polygon) {
    const rings = value.coordinates
      .map((ring) => `(${ring.map((c) => `${c[0]} ${c[1]}`).join(",")})`)
      .join(",");
    return `SRID=4326;POLYGON(${rings})`;
  },
  fromDriver(value: string): Polygon {
    const buf = Buffer.from(value, "hex");
    const geom = Geometry.parse(buf) as WkxPolygon;
    const coordinates: [number, number][][] = [
      geom.exteriorRing.map((p) => [p.x, p.y]) as [number, number][],
      ...geom.interiorRings.map(
        (ring) => ring.map((p) => [p.x, p.y]) as [number, number][],
      ),
    ];
    return { coordinates };
  },
});
