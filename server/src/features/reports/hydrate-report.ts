import { eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { categories } from "../../db/schema/categories.js";
import { reportPhotos } from "../../db/schema/report-photos.js";
import { votes } from "../../db/schema/votes.js";
import { NotFoundError } from "../../common/errors.js";

export async function hydrateReport(id: string) {
  const [row, photoRows, voteRow] = await Promise.all([
    db
      .select({
        id: reports.id,
        title: reports.title,
        description: reports.description,
        categoryId: reports.categoryId,
        categoryName: categories.name,
        status: reports.status,
        address: reports.address,
        latitude: sql<number>`ST_Y(${reports.location})`,
        longitude: sql<number>`ST_X(${reports.location})`,
        departmentId: reports.departmentId,
        createdAt: reports.createdAt,
      })
      .from(reports)
      .innerJoin(categories, eq(reports.categoryId, categories.id))
      .where(eq(reports.id, id))
      .limit(1),
    db
      .select({ url: reportPhotos.url, order: reportPhotos.order, kind: reportPhotos.kind })
      .from(reportPhotos)
      .where(eq(reportPhotos.reportId, id))
      .orderBy(reportPhotos.order),
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(votes)
      .where(eq(votes.reportId, id)),
  ]);

  if (row.length === 0) {
    throw new NotFoundError("Report not found");
  }

  const report = row[0];

  return {
    id: report.id,
    title: report.title,
    description: report.description,
    categoryId: report.categoryId,
    categoryName: report.categoryName,
    status: report.status,
    address: report.address,
    latitude: report.latitude,
    longitude: report.longitude,
    departmentId: report.departmentId,
    photos: photoRows,
    voteCount: voteRow[0]?.count ?? 0,
    createdAt: report.createdAt.toISOString(),
  };
}
