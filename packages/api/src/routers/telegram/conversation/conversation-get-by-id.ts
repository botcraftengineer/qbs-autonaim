import { conversation } from "@qbs-autonaim/db";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { verifyWorkspaceAccess } from "../utils";

export const getConversationByIdRouter = protectedProcedure
  .input(z.object({ id: uuidv7Schema, workspaceId: workspaceIdSchema }))
  .query(async ({ input, ctx }) => {
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      input.workspaceId,
      ctx.session.user.id,
    );

    const conv = await ctx.db.query.conversation.findFirst({
      where: eq(conversation.id, input.id),
      with: {
        response: {
          with: {
            vacancy: true,
          },
        },
      },
    });

    if (!conv) {
      return null;
    }

    if (conv.response?.vacancy?.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этой беседе",
      });
    }

    return conv;
  });
