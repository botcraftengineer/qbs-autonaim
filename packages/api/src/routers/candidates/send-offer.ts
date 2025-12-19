import { eq, workspaceRepository } from "@qbs-autonaim/db";
import { vacancyResponse } from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const sendOffer = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      candidateId: z.string(),
      offerDetails: z.object({
        position: z.string().min(1),
        salary: z.string().min(1),
        startDate: z.string().min(1),
        benefits: z.string().optional(),
        message: z.string().optional(),
      }),
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

    const response = await ctx.db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, input.candidateId),
      with: {
        vacancy: true,
      },
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Кандидат не найден",
      });
    }

    if (response.vacancy.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому кандидату",
      });
    }

    // Сохраняем детали оффера в поле contacts как временное решение
    const currentContacts =
      (response.contacts as Record<string, unknown>) || {};
    const updatedContacts = {
      ...currentContacts,
      offerDetails: input.offerDetails,
      offerSentAt: new Date().toISOString(),
    };

    // Обновляем статус и сохраняем детали оффера
    await ctx.db
      .update(vacancyResponse)
      .set({
        hrSelectionStatus: "OFFER",
        status: "COMPLETED",
        contacts: updatedContacts,
        updatedAt: new Date(),
      })
      .where(eq(vacancyResponse.id, input.candidateId));

    // Отправляем событие в Inngest для асинхронной отправки сообщения в Telegram
    try {
      await inngest.send({
        name: "candidate/offer.send",
        data: {
          responseId: input.candidateId,
          workspaceId: input.workspaceId,
          offerDetails: input.offerDetails,
        },
      });
    } catch (error) {
      console.error("Не удалось отправить событие отправки оффера:", error);
      // Не бросаем ошибку, так как статус уже обновлен
    }

    return {
      success: true,
      candidateId: input.candidateId,
      offerDetails: input.offerDetails,
    };
  });
