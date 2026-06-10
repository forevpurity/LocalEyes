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
import { updateReport, updateReportDoc } from "./update-report.js";
import { withdrawReport, withdrawReportDoc } from "./withdraw-report.js";
import { hideReport, hideReportDoc } from "./hide-report.js";
import { lockReport, lockReportDoc } from "./lock-report.js";
import { assignReport, assignReportDoc } from "./assign-report.js";

export const reportsRouter = Router();

createReport(reportsRouter);
listReports(reportsRouter);
getReport(reportsRouter);
createComment(reportsRouter);
updateReportStatus(reportsRouter);
updateReport(reportsRouter);
withdrawReport(reportsRouter);
hideReport(reportsRouter);
lockReport(reportsRouter);
assignReport(reportsRouter);

export const reportsPaths = {
  "/reports": {
    post: createReportDoc,
    get: listReportsDoc,
  },
  "/reports/{id}": {
    get: getReportDoc,
    patch: updateReportDoc,
  },
  "/reports/{id}/comments": {
    post: createCommentDoc,
  },
  "/reports/{id}/status": {
    post: updateReportStatusDoc,
  },
  "/reports/{id}/withdraw": {
    patch: withdrawReportDoc,
  },
  "/reports/{id}/hide": {
    patch: hideReportDoc,
  },
  "/reports/{id}/lock": {
    patch: lockReportDoc,
  },
  "/reports/{id}/assign": {
    patch: assignReportDoc,
  },
} satisfies ZodOpenApiPathsObject;