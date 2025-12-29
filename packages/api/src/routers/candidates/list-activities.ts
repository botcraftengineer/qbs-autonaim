import { eq } from "@qbs-autonaim/db";
import { vacancyResponseHistory } from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const EVENT_TYPE_DESCRIPTIONS: Record<string, string> = {
  CREATED: "Кандидат откликнулся на вакансию",
  STATUS_CHANGED: "Статус изменен",
  HR_STATUS_CHANGED: "HR статус изменен",
  TELEGRAM_USERNAME_ADDED: "Добавлен Telegram username",
  CHAT_ID_ADDED: "Добавлен Chat ID",
  PHONE_ADDED: "Добавлен номер телефона",
  RESUME_UPDATED: "Резюме обновлено",
  PHOTO_ADDED: "Добавлено фото",
  WELCOME_SENT: "Отправлено приветственное сообщение",
  OFFER_SENT: "Отправлен оффер",
  COMMENT_ADDED: "Добавлен комментарий",
  SALARY_UPDATED: "Обновлена зарплата",
  CONTACT_INFO_UPDATED: "Обновлена контактная информация",
};

export const listActivities = protectedProcedure
  .input(
    z.object({
      candidateId: uuidv7Schema,
      workspaceId: workspaceIdSchema,
    }),
  )
  .query(async ({ input, ctx }) => {
    const { candidateId, workspaceId } = input;

    // Проверяем существование отклика и доступ к workspace
    const response = await ctx.db.query.vacancyResponse.findFirst({
      where: (response, { eq }) => eq(response.id, candidateId),
      with: {
        vacancy: {
          columns: {
            workspaceId: true,
          },
        },
      },
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Кандидат не найден",
      });
    }

    if (!response.vacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия для этого кандидата не найдена",
      });
    }

    if (response.vacancy.workspaceId !== workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому кандидату",
      });
    }

    // Получаем историю активностей
    const activities = await ctx.db.query.vacancyResponseHistory.findMany({
      where: eq(vacancyResponseHistory.responseId, candidateId),
      with: {
        user: true,
      },
      orderBy: (history, { desc }) => [desc(history.createdAt)],
    });

    // Форматируем активности
    return activities.map((activity) => {
      let description =
        EVENT_TYPE_DESCRIPTIONS[activity.eventType] || activity.eventType;

      // Добавляем детали для некоторых типов событий
      if (activity.eventType === "STATUS_CHANGED" && activity.newValue) {
        const newStatus = (activity.newValue as { status?: string }).status;
        if (newStatus) {
          description = `Статус изменен на "${newStatus}"`;
        }
      }

      if (activity.eventType === "COMMENT_ADDED" && activity.metadata) {
        const comment = (activity.metadata as { comment?: string }).comment;
        if (comment) {
          description = `Добавлен комментарий: "${comment.substring(0, 100)}${comment.length > 100 ? "…" : ""}"`;
        }
      }

      return {
        id: activity.id,
        type: activity.eventType,
        description,
        author: activity.user?.name || null,
        authorAvatar: activity.user?.image || null,
        createdAt: activity.createdAt,
        metadata: activity.metadata,
      };
    });
  });
