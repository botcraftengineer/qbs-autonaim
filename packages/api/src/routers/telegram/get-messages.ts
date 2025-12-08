import { db, telegramMessage } from "@qbs-autonaim/db";
import { uuidv7Schema } from "@qbs-autonaim/validators";
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
      // Проверка доступа к workspace
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

      // Проверяем принадлежность беседы к workspace
      const conversation = await db.query.telegramConversation.findFirst({
        where: eq(telegramConversation.id, input.conversationId),
        with: {
          response: {
            with: {
              vacancy: true,
            },
          },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Беседа не найдена",
        });
      }

      if (conversation.response?.vacancy?.workspaceId !== input.workspaceId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Нет доступа к этой беседе",
        });
      }

      const messages = await db.query.telegramMessage.findMany({
        where: eq(telegramMessage.conversationId, input.conversationId),
        orderBy: [telegramMessage.createdAt],
        with: {
          file: true,
        },
      });

      // Генерируем presigned URLs для файлов
      const { getDownloadUrl } = await import("@qbs-autonaim/lib");

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
      // Проверка доступа к workspace
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

      const messages = await db
        .select({
          message: telegramMessage,
          conversation: telegramConversation,
          response: vacancyResponse,
          vacancy: vacancy,
        })
        .from(telegramMessage)
        .innerJoin(
          telegramConversation,
          eq(telegramMessage.conversationId, telegramConversation.id),
        )
        .innerJoin(
          vacancyResponse,
          eq(telegramConversation.responseId, vacancyResponse.id),
        )
        .innerJoin(vacancy, eq(vacancyResponse.vacancyId, vacancy.id))
        .where(eq(vacancy.workspaceId, input.workspaceId))
        .orderBy(desc(telegramMessage.createdAt))
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
