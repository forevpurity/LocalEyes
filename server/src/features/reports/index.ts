import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { createReport, createReportDoc } from "./create-report.js";
import { listReports, listReportsDoc } from "./list-reports.js";
import { getReport, getReportDoc } from "./get-report.js";
import { createComment, createCommentDoc } from "./create-comment.js";
import {
  updateReportStatus,
  updateReportStatusDoc,
} from "./update-report-status.js";

export const reportsRouter = Router();

createReport(reportsRouter);
listReports(reportsRouter);
getReport(reportsRouter);
createComment(reportsRouter);
updateReportStatus(reportsRouter);

export const reportsPaths = {
  "/reports": {
    post: createReportDoc,
    get: listReportsDoc,
  },
  "/reports/{id}": {
    get: getReportDoc,
  },
  "/reports/{id}/comments": {
    post: createCommentDoc,
  },
  "/reports/{id}/status": {
    post: updateReportStatusDoc,
  },
} satisfies ZodOpenApiPathsObject;