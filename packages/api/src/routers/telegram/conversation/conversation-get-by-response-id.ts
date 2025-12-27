import { conversation, vacancyResponse } from "@qbs-autonaim/db";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { verifyWorkspaceAccess } from "../utils";

export const getConversationByResponseIdRouter = protectedProcedure
  .input(z.object({ responseId: uuidv7Schema, workspaceId: workspaceIdSchema }))
  .query(async ({ input, ctx }) => {
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      input.workspaceId,
      ctx.session.user.id,
    );

    const response = await ctx.db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, input.responseId),
      with: {
        vacancy: true,
      },
    });

    if (!response || response.vacancy.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    const conv = await ctx.db.query.conversation.findFirst({
      where: eq(conversation.responseId, input.responseId),
    });

    return conv;
  });
