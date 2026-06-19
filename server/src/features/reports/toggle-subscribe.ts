import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { subscriptions } from "../../db/schema/subscriptions.js";
import {
  NotFoundError,
  DomainRuleError,
  errorResponseSchema,
} from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { requireCanSubscribeToReport } from "./lib/report-rules.js";

const toggleSubscribeResponse = z
  .object({
    subscribed: z.boolean(),
  })
  .meta({ id: "ToggleSubscribeResponse" });

export const toggleSubscribeDoc = {
  summary: "Toggle subscription on a report",
  tags: ["Reports"],
  operationId: "toggleSubscribe",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Report Id" }) }),
  },
  responses: {
    200: {
      description: "Subscription toggled",
      content: {
        "application/json": { schema: toggleSubscribeResponse },
      },
    },
    404: {
      description: "Report not found",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    422: {
      description:
        "Business rule violated (owner unsubscribing, hidden, or locked report)",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function toggleSubscribe(router: Router) {
  router.patch("/:id/subscribe", authenticate("citizen"), async (req, res) => {
    const actor = req.actor!;
    const { id } = req.params;

    const row = await db
      .select({
        isHidden: reports.isHidden,
        isLocked: reports.isLocked,
        citizenId: reports.citizenId,
      })
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);

    if (row.length === 0) {
      throw new NotFoundError("Report not found");
    }

    const report = row[0];

    requireCanSubscribeToReport(report, actor);

    const existing = await db
      .select({ reportId: subscriptions.reportId })
      .from(subscriptions)
      .where(
        sql`${subscriptions.reportId} = ${id} AND ${subscriptions.citizenId} = ${actor.id}`,
      )
      .limit(1);

    if (existing.length > 0) {
      if (report.citizenId === actor.id) {
        throw new DomainRuleError("Cannot unsubscribe from your own report");
      }
      await db
        .delete(subscriptions)
        .where(
          sql`${subscriptions.reportId} = ${id} AND ${subscriptions.citizenId} = ${actor.id}`,
        );
      res.json({ subscribed: false });
    } else {
      await db.insert(subscriptions).values({
        reportId: id,
        citizenId: actor.id,
      });
      res.json({ subscribed: true });
    }
  });
}
