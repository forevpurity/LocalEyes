import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { storage } from "../../services/storage.js";
import { db } from "../client.js";
import { reportPhotos } from "../schema/report-photos.js";
import type { SeedReport } from "./reports.js";

const bucketNames: Record<string, string> = {
  Pothole: "pothole",
  Graffiti: "graffiti",
  "Broken streetlight": "broken-streetlight",
  Trash: "trash",
  Flooding: "flooding",
};

export async function seedPhotos(reports: SeedReport[]) {
  const assetsDir = fileURLToPath(new URL("./assets/", import.meta.url));
  const beforeUrls = new Map<string, string[]>();
  const afterUrls: string[] = [];

  for (const [categoryName, bucket] of Object.entries(bucketNames)) {
    const urls: string[] = [];
    for (let number = 1; number <= 3; number++) {
      const filename = `${bucket}/before-${number}.jpg`;
      urls.push(await storage.put(
        `reports/seed/${bucket}-before-${number}.jpg`,
        await readFile(`${assetsDir}${filename}`),
        "image/jpeg",
      ));
    }
    beforeUrls.set(categoryName, urls);
  }
  for (let number = 1; number <= 3; number++) {
    afterUrls.push(await storage.put(
      `reports/seed/after-${number}.jpg`,
      await readFile(`${assetsDir}after/after-${number}.jpg`),
      "image/jpeg",
    ));
  }

  const rows: (typeof reportPhotos.$inferInsert)[] = [];
  reports.forEach((report, index) => {
    const urls = beforeUrls.get(report.categoryName)!;
    const beforeCount = index % 9 === 0 ? 3 : index % 7 === 0 ? 2 : 1;
    for (let order = 0; order < beforeCount; order++) {
      rows.push({
        reportId: report.id, url: urls[(index + order) % urls.length]!, kind: "before", order,
        createdAt: new Date(report.createdAt.getTime() + order * 60_000),
      });
    }
    if (report.status === "resolved" || report.status === "closed") {
      rows.push({
        reportId: report.id, url: afterUrls[index % afterUrls.length]!, kind: "after", order: beforeCount,
        createdAt: report.lastEventAt,
      });
    }
  });
  await db.insert(reportPhotos).values(rows);
  return rows.length;
}
