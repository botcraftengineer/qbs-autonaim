import { and, eq, lt, workspaceRepository } from "@qbs-autonaim/db";
import { funnelActivity, funnelCandidate } from "@qbs-autonaim/db/schema";
import { uuidv7Schema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const list = protectedProcedure
  .input(
    z.object({
      candidateId: z.string().uuid(),
      limit: z.number().int().min(1).max(100).default(20),
      cursor: uuidv7Schema.optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const candidate = await ctx.db.query.funnelCandidate.findFirst({
      where: eq(funnelCandidate.id, input.candidateId),
      columns: { workspaceId: true },
    });

    if (!candidate) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Кандидат не найден",
      });
    }

    const access = await workspaceRepository.checkAccess(
      candidate.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к данному кандидату",
      });
    }

    const conditions = [eq(funnelActivity.candidateId, input.candidateId)];

    if (input.cursor) {
      conditions.push(lt(funnelActivity.id, input.cursor));
    }

    const activities = await ctx.db.query.funnelActivity.findMany({
      where: and(...conditions),
      orderBy: (activities, { desc }) => [desc(activities.createdAt)],
      limit: input.limit + 1,
    });

    let nextCursor: string | undefined;
    if (activities.length > input.limit) {
      const nextItem = activities.pop();
      nextCursor = nextItem?.id;
    }

    return {
      items: activities,
      nextCursor,
    };
  });
