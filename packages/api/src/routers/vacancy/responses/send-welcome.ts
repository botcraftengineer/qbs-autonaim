import { eq, workspaceRepository } from "@qbs-autonaim/db";
import { conversation, vacancyResponse } from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const sendWelcome = protectedProcedure
  .input(
    z.object({
      responseId: z.string(),
      username: z.string(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { responseId, username, workspaceId } = input;

    // Проверка доступа к рабочему пространству
    const access = await workspaceRepository.checkAccess(
      workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому рабочему пространству",
      });
    }

    // Получаем данные отклика
    const response = await ctx.db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, responseId),
      with: {
        vacancy: true,
      },
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    if (!response.vacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Проверка принадлежности вакансии к рабочему пространству
    if (response.vacancy.workspaceId !== workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    // Создаем или обновляем запись в conversations
    const cleanUsername = username.startsWith("@")
      ? username.substring(1)
      : username;

    // Проверяем существующую conversation
    const existingConv = await ctx.db.query.conversation.findFirst({
      where: eq(conversation.responseId, responseId),
    });

    if (existingConv) {
      // Парсим существующие метаданные
      let existingMetadata: Record<string, unknown> = {};
      if (existingConv.metadata) {
        try {
          existingMetadata = JSON.parse(existingConv.metadata);
        } catch (error) {
          console.error("Failed to parse existing metadata", {
            conversationId: existingConv.id,
            error,
          });
        }
      }

      // Объединяем с новыми данными
      const updatedMetadata = {
        ...existingMetadata,
        responseId,
        vacancyId: response.vacancyId,
      };

      // Обновляем существующую conversation
      await ctx.db
        .update(conversation)
        .set({
          candidateName: response.candidateName,
          username: cleanUsername,
          status: "ACTIVE",
          metadata: JSON.stringify(updatedMetadata),
        })
        .where(eq(conversation.id, existingConv.id));
    } else {
      // Создаем новую conversation
      await ctx.db.insert(conversation).values({
        responseId,
        candidateName: response.candidateName,
        username: cleanUsername,
        status: "ACTIVE",
        metadata: JSON.stringify({
          responseId,
          vacancyId: response.vacancyId,
        }),
      });
    }

    // Отправляем событие через Inngest клиент
    await inngest.send({
      name: "candidate/welcome",
      data: {
        responseId,
        username: cleanUsername,
      },
    });

    return {
      success: true,
      message: "Приветственное сообщение отправлено",
    };
  });
