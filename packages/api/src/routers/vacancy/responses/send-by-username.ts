import { eq } from "@qbs-autonaim/db";
import { vacancyResponse } from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const sendByUsername = protectedProcedure
  .input(
    z.object({
      responseId: z.string(),
      username: z.string().min(1, "Username обязателен"),
      workspaceId: workspaceIdSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { responseId, username, workspaceId } = input;

    // Проверка доступа к workspace
    const access = await workspaceRepository.checkAccess(
      workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Проверяем, что отклик существует
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

    // Проверка принадлежности вакансии к workspace
    if (response.vacancy.workspaceId !== workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    // Отправляем событие в Inngest для асинхронной обработки
    await inngest.send({
      name: "candidate/welcome",
      data: {
        responseId,
        username,
      },
    });

    return {
      success: true,
      message: "Приветственное сообщение отправляется в фоновом режиме",
    };
  });
