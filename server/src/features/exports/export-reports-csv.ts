import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { authenticate } from "../../common/auth.js";
import { errorResponseSchema } from "../../common/errors.js";
import { queryExportRows } from "./query-export-rows.js";

export const exportReportsCsvDoc = {
  summary: "Export all reports as CSV",
  tags: ["Exports"],
  operationId: "exportReportsCsv",
  responses: {
    200: {
      description: "CSV file of reports",
      content: { "text/csv": { schema: z.string() } },
    },
    401: {
      description: "Authentication required",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "Admin only",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
} satisfies ZodOpenApiOperationObject;

const CSV_HEADER = [
  "id",
  "title",
  "description",
  "category",
  "status",
  "department",
  "latitude",
  "longitude",
  "created_at",
  "resolved_at",
];

function toCsvCell(value: string | number | null): string {
  if (value === null) return "";
  const str =
    typeof value === "string"
      ? neutralizeSpreadsheetFormula(value)
      : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function neutralizeSpreadsheetFormula(value: string): string {
  return /^[=+\-@\t\r\n]/.test(value) ? `'${value}` : value;
}

function toCsvRow(values: (string | number | null)[]): string {
  return values.map(toCsvCell).join(",");
}

export function exportReportsCsv(router: Router) {
  router.get("/reports.csv", authenticate("admin"), async (_req, res) => {
    const rows = await queryExportRows();

    const lines = [toCsvHeader()];
    for (const r of rows) {
      lines.push(
        toCsvRow([
          r.id,
          r.title,
          r.description,
          r.category,
          r.status,
          r.department,
          r.latitude,
          r.longitude,
          r.createdAt,
          r.resolvedAt,
        ]),
      );
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="reports.csv"',
    );
    res.send(lines.join("\r\n"));
  });
}

function toCsvHeader(): string {
  return CSV_HEADER.join(",");
}
