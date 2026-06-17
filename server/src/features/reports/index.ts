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
import { unhideReport, unhideReportDoc } from "./unhide-report.js";
import { lockReport, lockReportDoc } from "./lock-report.js";
import { unlockReport, unlockReportDoc } from "./unlock-report.js";
import { assignReport, assignReportDoc } from "./assign-report.js";
import { toggleVote, toggleVoteDoc } from "./toggle-vote.js";
import { toggleSubscribe, toggleSubscribeDoc } from "./toggle-subscribe.js";
import { hideComment, hideCommentDoc } from "./hide-comment.js";
import { editComment, editCommentDoc } from "./edit-comment.js";
import { myStats, myStatsDoc } from "./my-stats.js";
import { addReportPhotos, addReportPhotosDoc } from "./add-report-photos.js";
import { removeReportPhoto, removeReportPhotoDoc } from "./remove-report-photo.js";

export const reportsRouter = Router();

createReport(reportsRouter);
listReports(reportsRouter);
myStats(reportsRouter);
getReport(reportsRouter);
createComment(reportsRouter);
updateReportStatus(reportsRouter);
updateReport(reportsRouter);
withdrawReport(reportsRouter);
hideReport(reportsRouter);
unhideReport(reportsRouter);
lockReport(reportsRouter);
unlockReport(reportsRouter);
assignReport(reportsRouter);
toggleVote(reportsRouter);
toggleSubscribe(reportsRouter);
hideComment(reportsRouter);
editComment(reportsRouter);
addReportPhotos(reportsRouter);
removeReportPhoto(reportsRouter);

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
  "/reports/{id}/unhide": {
    patch: unhideReportDoc,
  },
  "/reports/{id}/lock": {
    patch: lockReportDoc,
  },
  "/reports/{id}/unlock": {
    patch: unlockReportDoc,
  },
  "/reports/{id}/assign": {
    patch: assignReportDoc,
  },
  "/reports/{id}/vote": {
    patch: toggleVoteDoc,
  },
  "/reports/{id}/subscribe": {
    patch: toggleSubscribeDoc,
  },
  "/reports/{id}/comments/{commentId}/hide": {
    patch: hideCommentDoc,
  },
  "/reports/{id}/photos": {
    post: addReportPhotosDoc,
  },
  "/reports/{id}/photos/{photoId}": {
    delete: removeReportPhotoDoc,
  },
  "/reports/{id}/comments/{commentId}": {
    patch: editCommentDoc,
  },
  "/reports/my-stats": {
    get: myStatsDoc,
  },
} satisfies ZodOpenApiPathsObject;