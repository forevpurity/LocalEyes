import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reports } from "../../db/schema/reports.js";
import { votes } from "../../db/schema/votes.js";
import {
  NotFoundError,
  errorResponseSchema,
} from "../../common/errors.js";
import { authenticate } from "../../common/auth.js";
import { requireCanVoteOnReport } from "./report-rules.js";

const toggleVoteResponse = z
  .object({
    voted: z.boolean(),
    voteCount: z.number(),
  })
  .meta({ id: "ToggleVoteResponse" });

export const toggleVoteDoc = {
  summary: "Toggle vote on a report",
  tags: ["Reports"],
  operationId: "toggleVote",
  requestParams: {
    path: z.object({ id: z.uuid().meta({ description: "Report Id" }) }),
  },
  responses: {
    200: {
      description: "Vote toggled",
      content: {
        "application/json": { schema: toggleVoteResponse },
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
        "Business rule violated (self-vote, hidden, or locked report)",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
} satisfies ZodOpenApiOperationObject;

export function toggleVote(router: Router) {
  router.patch(
    "/:id/vote",
    authenticate("citizen"),
    async (req, res) => {
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

      requireCanVoteOnReport(report, actor);

      const existing = await db
        .select({ reportId: votes.reportId })
        .from(votes)
        .where(
          sql`${votes.reportId} = ${id} AND ${votes.citizenId} = ${actor.id}`,
        )
        .limit(1);

      let voted: boolean;
      if (existing.length > 0) {
        await db
          .delete(votes)
          .where(
            sql`${votes.reportId} = ${id} AND ${votes.citizenId} = ${actor.id}`,
          );
        voted = false;
      } else {
        await db.insert(votes).values({
          reportId: id,
          citizenId: actor.id,
        });
        voted = true;
      }

      const [voteRow] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(votes)
        .where(eq(votes.reportId, id));

      res.json({
        voted,
        voteCount: voteRow?.count ?? 0,
      });
    },
  );
}
