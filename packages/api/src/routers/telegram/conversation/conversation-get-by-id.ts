import {
  conversation,
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db";
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
    });

    if (!conv) {
      return null;
    }

    // Query response separately to check workspace access
    if (conv.responseId) {
      const response = await ctx.db.query.response.findFirst({
        where: eq(responseTable.id, conv.responseId),
      });

      if (response) {
        const vacancy = await ctx.db.query.vacancy.findFirst({
          where: eq(vacancyTable.id, response.entityId),
          columns: { workspaceId: true },
        });

        if (!vacancy || vacancy.workspaceId !== input.workspaceId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Нет доступа к этой беседе",
          });
        }
      }
    }

    return conv;
  });
