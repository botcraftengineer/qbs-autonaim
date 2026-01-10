import { and, eq, isNull } from "@qbs-autonaim/db";
import type { response as responseTable } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const sendGreeting = protectedProcedure
  .input(
    z.object({
      candidateId: z.uuid(),
      workspaceId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { candidateId, workspaceId } = input;

    const candidate = await ctx.db.query.response.findFirst({
      where: (
        response: typeof responseTable,
        { eq, and }: { eq: any; and: any },
      ) =>
        and(eq(response.id, candidateId), eq(response.entityType, "vacancy")),
      with: {
        vacancy: {
          columns: {
            workspaceId: true,
          },
        },
      },
    });

    if (!candidate) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Кандидат не найден",
      });
    }

    if (candidate.vacancy.workspaceId !== workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому кандидату",
      });
    }

    // Идемпотентное обновление: устанавливаем welcomeSentAt только если оно NULL
    // Это предотвращает race condition при конкурентных запросах
    const updateResult = await ctx.db
      .update(responseTable)
      .set({ welcomeSentAt: new Date() })
      .where(
        and(
          eq(responseTable.id, candidateId),
          eq(responseTable.entityType, "vacancy"),
          isNull(responseTable.welcomeSentAt),
        ),
      )
      .returning({ id: responseTable.id });

    // Проверяем, была ли обновлена строка
    // Если 0 строк обновлено, значит приветствие уже было отправлено
    if (updateResult.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Приветствие уже было отправлено",
      });
    }

    // Отправляем событие в Inngest для отправки приветственного сообщения
    try {
      await ctx.inngest.send({
        name: "candidate/welcome",
        data: {
          responseId: candidateId,
          username: candidate.telegramUsername || undefined,
          phone: candidate.phone || undefined,
        },
      });
    } catch (error) {
      // Логируем ошибку и откатываем welcomeSentAt
      console.error("Ошибка отправки события в Inngest:", error);

      // Откатываем welcomeSentAt, чтобы можно было повторить попытку
      await ctx.db
        .update(responseTable)
        .set({ welcomeSentAt: null })
        .where(
          and(
            eq(responseTable.id, candidateId),
            eq(responseTable.entityType, "vacancy"),
          ),
        );

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось отправить приветствие. Попробуйте позже.",
      });
    }

    return { success: true };
  });
