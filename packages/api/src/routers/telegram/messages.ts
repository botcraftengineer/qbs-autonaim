import {
  conversation,
  conversationMessage,
  vacancy,
  vacancyResponse,
  workspaceRepository,
} from "@qbs-autonaim/db";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const getMessagesRouter = {
  getByConversationId: protectedProcedure
    .input(
      z.object({
        conversationId: uuidv7Schema,
        workspaceId: workspaceIdSchema,
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
          message: "Нет доступа к этому workspace",
        });
      }

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

      const { getDownloadUrl } = await import("@qbs-autonaim/lib/s3");

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
    }),

  getRecent: protectedProcedure
    .input(
      z.object({
        workspaceId: workspaceIdSchema,
        limit: z.number().min(1).max(100).default(10),
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
          message: "Нет доступа к этому workspace",
        });
      }

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
    }),
} satisfies TRPCRouterRecord;
