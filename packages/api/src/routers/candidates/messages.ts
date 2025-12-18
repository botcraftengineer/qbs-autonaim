import { desc, eq, workspaceRepository } from "@qbs-autonaim/db";
import {
  telegramConversation,
  telegramMessage,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const listMessages = protectedProcedure
  .input(
    z.object({
      candidateId: uuidv7Schema,
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
        message: "Нет доступа к workspace",
      });
    }

    // Найти conversation для этого кандидата
    const conversation = await ctx.db.query.telegramConversation.findFirst({
      where: eq(telegramConversation.responseId, input.candidateId),
    });

    if (!conversation) {
      return [];
    }

    // Получить сообщения
    const messages = await ctx.db.query.telegramMessage.findMany({
      where: eq(telegramMessage.conversationId, conversation.id),
      orderBy: desc(telegramMessage.createdAt),
      limit: 100,
    });

    return messages.reverse().map((msg) => ({
      id: msg.id,
      content: msg.content,
      sender: msg.sender === "CANDIDATE" ? "candidate" : "recruiter",
      senderName:
        msg.sender === "CANDIDATE"
          ? conversation.candidateName || "Кандидат"
          : "Рекрутер",
      senderAvatar: null,
      timestamp: msg.createdAt,
    }));
  });

export const sendMessage = protectedProcedure
  .input(
    z.object({
      candidateId: uuidv7Schema,
      workspaceId: workspaceIdSchema,
      content: z.string().min(1).max(5000),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const access = await workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Проверить, что кандидат принадлежит workspace
    const response = await ctx.db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, input.candidateId),
      with: {
        vacancy: {
          columns: {
            workspaceId: true,
          },
        },
      },
    });

    if (!response || response.vacancy.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому кандидату",
      });
    }

    // Найти или создать conversation
    let conversation = await ctx.db.query.telegramConversation.findFirst({
      where: eq(telegramConversation.responseId, input.candidateId),
    });

    if (!conversation) {
      // Создать новый conversation если его нет
      const [newConversation] = await ctx.db
        .insert(telegramConversation)
        .values({
          responseId: input.candidateId,
          candidateName: response.candidateName || "Кандидат",
          status: "ACTIVE",
        })
        .returning();

      conversation = newConversation;
    }

    if (!conversation) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать conversation",
      });
    }

    // Создать сообщение
    await ctx.db.insert(telegramMessage).values({
      conversationId: conversation.id,
      sender: "ADMIN",
      contentType: "TEXT",
      content: input.content,
    });

    return { success: true };
  });
