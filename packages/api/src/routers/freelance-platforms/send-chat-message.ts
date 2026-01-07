import { randomUUID } from "node:crypto";
import { env } from "@qbs-autonaim/config";
import { conversationMessage } from "@qbs-autonaim/db/schema";
import { messageBufferService } from "@qbs-autonaim/jobs/services/buffer";
import type { BufferedMessage } from "@qbs-autonaim/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";
import { createErrorHandler } from "../../utils/error-handler";

const sendChatMessageInputSchema = z.object({
  conversationId: z.uuid(),
  message: z.string().min(1, "Сообщение не может быть пустым").max(10000),
});

const conversationMetadataSchema = z
  .object({
    questionAnswers: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        }),
      )
      .default([]),
  })
  .default({ questionAnswers: [] });

export const sendChatMessage = publicProcedure
  .input(sendChatMessageInputSchema)
  .mutation(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      undefined,
      ctx.ipAddress,
      ctx.userAgent,
    );

    try {
      // Проверяем существование conversation
      const conv = await ctx.db.query.conversation.findFirst({
        where: (conversation, { eq, and }) =>
          and(
            eq(conversation.id, input.conversationId),
            eq(conversation.source, "WEB"),
          ),
      });

      if (!conv) {
        throw await errorHandler.handleNotFoundError("Разговор", {
          conversationId: input.conversationId,
        });
      }

      // Проверяем, что разговор активен
      if (conv.status !== "ACTIVE") {
        throw await errorHandler.handleValidationError("Разговор завершён", {
          conversationId: input.conversationId,
          status: conv.status,
        });
      }

      // Получаем текущий номер вопроса из метаданных с валидацией
      const parsedMetadata = conversationMetadataSchema.parse(
        conv.metadata || {},
      );
      const interviewStep = parsedMetadata.questionAnswers.length + 1;

      // Сохраняем сообщение в conversation_messages
      const [savedMessage] = await ctx.db
        .insert(conversationMessage)
        .values({
          conversationId: input.conversationId,
          sender: "CANDIDATE",
          contentType: "TEXT",
          channel: conv.source,
          content: input.message,
        })
        .returning();

      if (!savedMessage) {
        throw await errorHandler.handleInternalError(
          new Error("Failed to save message"),
          {
            conversationId: input.conversationId,
          },
        );
      }

      // Добавляем сообщение в буфер
      const messageId = randomUUID();
      const timestamp = Date.now();

      const bufferedMessage: BufferedMessage = {
        id: messageId,
        content: input.message,
        contentType: "TEXT",
        timestamp,
      };

      await messageBufferService.addMessage({
        userId: conv.username || "web_user",
        conversationId: input.conversationId,
        interviewStep,
        message: bufferedMessage,
      });

      // Отправляем событие debounce через fetch (так как Inngest клиент доступен только в jobs)
      const inngestEventUrl =
        env.INNGEST_EVENT_API_BASE_URL || "https://inn.gs";
      const inngestEventKey = env.INNGEST_EVENT_KEY;

      if (inngestEventKey) {
        try {
          await fetch(`${inngestEventUrl}/e/${inngestEventKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: "interview/message.buffered",
              data: {
                userId: conv.username || "web_user",
                conversationId: input.conversationId,
                interviewStep,
                messageId,
                timestamp,
              },
            }),
          });
        } catch (error) {
          console.error("Failed to send Inngest event:", error);
          // Не бросаем ошибку, чтобы не блокировать пользователя
        }
      }

      return {
        success: true,
        messageId: savedMessage.id,
      };
    } catch (error) {
      // Пробрасываем TRPC ошибки как есть
      if (error instanceof TRPCError) {
        throw error;
      }
      // Все остальные ошибки обрабатываем через errorHandler
      throw await errorHandler.handleDatabaseError(error as Error, {
        conversationId: input.conversationId,
        operation: "send_chat_message",
      });
    }
  });
