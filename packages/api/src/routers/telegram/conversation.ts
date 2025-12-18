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
import { and, desc, eq, inArray } from "drizzle-orm";
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

      const conversations = await ctx.db
        .select()
        .from(conversation)
        .innerJoin(
          vacancyResponse,
          eq(conversation.responseId, vacancyResponse.id),
        )
        .innerJoin(vacancy, eq(vacancyResponse.vacancyId, vacancy.id))
        .where(
          input.vacancyId
            ? and(
                eq(vacancy.workspaceId, input.workspaceId),
                eq(vacancyResponse.vacancyId, input.vacancyId),
              )
            : eq(vacancy.workspaceId, input.workspaceId),
        );

      if (conversations.length === 0) {
        return [];
      }

      const conversationIds = conversations.map((c) => c.conversations.id);

      const allMessages = await ctx.db
        .select()
        .from(conversationMessage)
        .where(inArray(conversationMessage.conversationId, conversationIds))
        .orderBy(desc(conversationMessage.createdAt));

      const messagesByConversation = new Map<string, (typeof allMessages)[0]>();
      for (const msg of allMessages) {
        if (!messagesByConversation.has(msg.conversationId)) {
          messagesByConversation.set(msg.conversationId, msg);
        }
      }

      const conversationsWithMessages = conversations.map((conv) => {
        const lastMessage = messagesByConversation.get(conv.conversations.id);
        return {
          ...conv.conversations,
          messages: lastMessage ? [lastMessage] : [],
          response: {
            ...conv.vacancy_responses,
            vacancy: conv.vacancies,
          },
        };
      });

      conversationsWithMessages.sort((a, b) => {
        const aLastMessage = a.messages[0];
        const bLastMessage = b.messages[0];

        if (!aLastMessage && !bLastMessage) return 0;
        if (!aLastMessage) return 1;
        if (!bLastMessage) return -1;

        return (
          bLastMessage.createdAt.getTime() - aLastMessage.createdAt.getTime()
        );
      });

      return conversationsWithMessages;
    }),

  getById: protectedProcedure
    .input(z.object({ id: uuidv7Schema, workspaceId: workspaceIdSchema }))
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
    }),

  getByResponseId: protectedProcedure
    .input(
      z.object({ responseId: uuidv7Schema, workspaceId: workspaceIdSchema }),
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
    }),

  getByUsername: protectedProcedure
    .input(z.object({ username: z.string(), workspaceId: workspaceIdSchema }))
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
        where: eq(conversation.username, input.username),
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
    }),
} satisfies TRPCRouterRecord;
