import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import {
  listNotifications,
  listNotificationsDoc,
} from "./list-notifications.js";
import {
  getUnreadCount,
  getUnreadCountDoc,
} from "./get-unread-count.js";
import { markRead, markReadDoc } from "./mark-read.js";
import { markAllRead, markAllReadDoc } from "./mark-all-read.js";

export const notificationsRouter = Router();

listNotifications(notificationsRouter);
getUnreadCount(notificationsRouter);
markRead(notificationsRouter);
markAllRead(notificationsRouter);

export const notificationsPaths = {
  "/notifications": {
    get: listNotificationsDoc,
  },
  "/notifications/unread-count": {
    get: getUnreadCountDoc,
  },
  "/notifications/{id}/read": {
    patch: markReadDoc,
  },
  "/notifications/read": {
    patch: markAllReadDoc,
  },
} satisfies ZodOpenApiPathsObject;
