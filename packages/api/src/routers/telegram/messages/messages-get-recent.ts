import {
  conversation,
  conversationMessage,
  vacancy,
  vacancyResponse,
} from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { verifyWorkspaceAccess } from "../utils";

export const getRecentMessagesRouter = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      limit: z.number().min(1).max(100).default(10),
    }),
  )
  .query(async ({ input, ctx }) => {
    await verifyWorkspaceAccess(ctx.workspaceRepository, input.workspaceId, ctx.session.user.id);

    const messages = await ctx.db
      .select({
        message: conversationMessage,
        conversation: conversation,
        response: vacancyResponse,
        vacancy: vacancy,
      })
      .from(conversationMessage)
      .innerJoin(
        conversation,
        eq(conversationMessage.conversationId, conversation.id),
      )
      .innerJoin(
        vacancyResponse,
        eq(conversation.responseId, vacancyResponse.id),
      )
      .innerJoin(vacancy, eq(vacancyResponse.vacancyId, vacancy.id))
      .where(eq(vacancy.workspaceId, input.workspaceId))
      .orderBy(desc(conversationMessage.createdAt))
      .limit(input.limit);

    return messages.map((row) => ({
      ...row.message,
      conversation: {
        ...row.conversation,
        response: {
          ...row.response,
          vacancy: row.vacancy,
        },
      },
    }));
  });
