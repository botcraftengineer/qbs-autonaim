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
import { desc, eq } from "drizzle-orm";
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

      const conversations = await db.query.telegramConversation.findMany({
        orderBy: [desc(telegramConversation.updatedAt)],
        with: {
          messages: {
            orderBy: [desc(telegramMessage.createdAt)],
            limit: 1,
          },
          response: {
            with: {
              vacancy: true,
            },
          },
        },
      });

      // Фильтруем только те беседы, которые принадлежат workspace
      const filteredConversations = conversations.filter((conv) => {
        return conv.response?.vacancy?.workspaceId === input.workspaceId;
      });

      // Если указан vacancyId, дополнительно фильтруем по нему
      if (input.vacancyId) {
        return filteredConversations.filter((conv) => {
          return conv.response?.vacancyId === input.vacancyId;
        });
      }

      return filteredConversations;
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
