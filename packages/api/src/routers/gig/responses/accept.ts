import { eq, sql } from "@qbs-autonaim/db";
import { gig, response as responseTable } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const accept = protectedProcedure
  .input(
    z.object({
      responseId: z.string(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const response = await ctx.db.query.response.findFirst({
      where: eq(responseTable.id, input.responseId),
      ,
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    if (response.gig.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    const wasNew = response.status === "NEW";

    const [updated] = await ctx.db
      .update(responseTable)
      .set({
        status: "EVALUATED",
        hrSelectionStatus: "RECOMMENDED",
        updatedAt: new Date(),
      })
      .where(eq(responseTable.id, input.responseId))
      .returning();

    // Если отклик был NEW, уменьшаем счетчик новых откликов
    if (wasNew) {
      await ctx.db
        .update(gig)
        .set({
          newResponses: sql`GREATEST(COALESCE(${gig.newResponses}, 0) - 1, 0)`,
        })
        .where(eq(gig.id, response.entityId));
    }

    return updated;
  });
