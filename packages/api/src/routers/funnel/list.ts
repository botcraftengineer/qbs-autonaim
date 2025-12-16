import { and, eq, workspaceRepository } from "@qbs-autonaim/db";
import { funnelCandidate } from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const list = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      vacancyId: uuidv7Schema.optional(),
      limit: z.number().int().min(1).max(100).default(50),
      cursor: uuidv7Schema.optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const access = await workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    const conditions = [eq(funnelCandidate.workspaceId, input.workspaceId)];

    if (input.vacancyId) {
      conditions.push(eq(funnelCandidate.vacancyId, input.vacancyId));
    }

    const candidates = await ctx.db.query.funnelCandidate.findMany({
      where: and(...conditions),
      orderBy: (candidates, { desc }) => [desc(candidates.createdAt)],
      limit: input.limit + 1,
    });

    let nextCursor: string | undefined;
    if (candidates.length > input.limit) {
      const nextItem = candidates.pop();
      nextCursor = nextItem?.id;
    }

    return {
      items: candidates,
      nextCursor,
    };
  });
