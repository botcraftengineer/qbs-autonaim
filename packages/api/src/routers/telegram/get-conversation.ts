import {
  db,
  telegramConversation,
  telegramMessage,
  vacancy,
  vacancyResponse,
  workspaceRepository,
} from "@selectio/db";
import { uuidv7Schema, workspaceIdSchema } from "@selectio/validators";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const getConversationRouter = {
  getAll: protectedProcedure
    .input(
      z.object({
        workspaceId: workspaceIdSchema,
        vacancyId: z.string().optional(),
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

      const conversations = await db
        .select()
        .from(telegramConversation)
        .innerJoin(
          vacancyResponse,
          eq(telegramConversation.responseId, vacancyResponse.id),
        )
        .innerJoin(vacancy, eq(vacancyResponse.vacancyId, vacancy.id))
        .where(
          input.vacancyId
            ? and(
                eq(vacancy.workspaceId, input.workspaceId),
                eq(vacancyResponse.vacancyId, input.vacancyId),
              )
            : eq(vacancy.workspaceId, input.workspaceId),
        )
        .orderBy(desc(telegramConversation.updatedAt));

      // Получаем сообщения для каждой беседы
      const conversationsWithMessages = await Promise.all(
        conversations.map(async (conv) => {
          const messages = await db.query.telegramMessage.findMany({
            where: eq(
              telegramMessage.conversationId,
              conv.telegram_conversations.id,
            ),
            orderBy: [desc(telegramMessage.createdAt)],
            limit: 1,
          });

          return {
            ...conv.telegram_conversations,
            messages,
            response: {
              ...conv.vacancy_responses,
              vacancy: conv.vacancies,
            },
          };
        }),
      );

      return conversationsWithMessages;
    }),

  getById: protectedProcedure
    .input(z.object({ id: uuidv7Schema, workspaceId: workspaceIdSchema }))
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

      const conversation = await db.query.telegramConversation.findFirst({
        where: eq(telegramConversation.id, input.id),
        with: {
          response: {
            with: {
              vacancy: true,
            },
          },
        },
      });

      if (!conversation) {
        return null;
      }

      // Проверка принадлежности к workspace
      if (conversation.response?.vacancy?.workspaceId !== input.workspaceId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Нет доступа к этой беседе",
        });
      }

      return conversation;
    }),

  getByResponseId: protectedProcedure
    .input(
      z.object({ responseId: uuidv7Schema, workspaceId: workspaceIdSchema }),
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

      // Проверяем принадлежность отклика к workspace
      const response = await db.query.vacancyResponse.findFirst({
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

      const conversation = await db.query.telegramConversation.findFirst({
        where: eq(telegramConversation.responseId, input.responseId),
      });

      return conversation;
    }),

  getByChatId: protectedProcedure
    .input(z.object({ chatId: z.string(), workspaceId: workspaceIdSchema }))
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

      const conversation = await db.query.telegramConversation.findFirst({
        where: eq(telegramConversation.chatId, input.chatId),
        with: {
          response: {
            with: {
              vacancy: true,
            },
          },
        },
      });

      if (!conversation) {
        return null;
      }

      // Проверка принадлежности к workspace
      if (conversation.response?.vacancy?.workspaceId !== input.workspaceId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Нет доступа к этой беседе",
        });
      }

      return conversation;
    }),
} satisfies TRPCRouterRecord;
