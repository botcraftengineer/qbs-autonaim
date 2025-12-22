import { conversation, conversationMessage } from "@qbs-autonaim/db";
import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { verifyWorkspaceAccess } from "../utils";

export const getMessagesByConversationIdRouter = protectedProcedure
  .input(
    z.object({
      conversationId: uuidv7Schema,
      workspaceId: workspaceIdSchema,
    }),
  )
  .query(async ({ input, ctx }) => {
    await verifyWorkspaceAccess(input.workspaceId, ctx.session.user.id);

    const conv = await ctx.db.query.conversation.findFirst({
      where: eq(conversation.id, input.conversationId),
      with: {
        response: {
          with: {
            vacancy: true,
          },
        },
      },
    });

    if (!conv) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Беседа не найдена",
      });
    }

    if (conv.response?.vacancy?.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этой беседе",
      });
    }

    const messages = await ctx.db.query.conversationMessage.findMany({
      where: eq(conversationMessage.conversationId, input.conversationId),
      orderBy: [conversationMessage.createdAt],
      with: {
        file: true,
      },
    });

    const messagesWithUrls = await Promise.all(
      messages.map(async (msg) => {
        if (msg.file?.key) {
          const fileUrl = await getDownloadUrl(msg.file.key);
          return {
            ...msg,
            fileUrl,
            fileId: msg.fileId,
          };
        }
        return {
          ...msg,
          fileUrl: null,
          fileId: msg.fileId,
        };
      }),
    );

    return messagesWithUrls;
  });
