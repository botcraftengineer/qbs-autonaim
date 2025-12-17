import { eq, workspaceRepository } from "@qbs-autonaim/db";
import { vacancyResponse } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

// TODO: Сохранить offerDetails в базу данных
// Требуется добавить новую таблицу или поле в схему для хранения деталей оффера
// (position, salary, startDate, benefits, message)
// После добавления схемы - использовать input.offerDetails для сохранения данных
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

    // TODO: Сохранить offerDetails в базу данных когда будет готова схема
    // Временно логируем данные для отладки
    console.log("Offer details to be persisted:", {
      candidateId: input.candidateId,
      offerDetails: input.offerDetails,
    });

    await ctx.db
      .update(vacancyResponse)
      .set({
        hrSelectionStatus: "OFFER",
        status: "COMPLETED",
        updatedAt: new Date(),
      })
      .where(eq(vacancyResponse.id, input.candidateId));

    return {
      success: true,
      candidateId: input.candidateId,
      offerDetails: input.offerDetails,
    };
  });
