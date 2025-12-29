import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const refreshResume = protectedProcedure
  .input(
    z.object({
      candidateId: z.string().uuid(),
      workspaceId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { candidateId, workspaceId } = input;

    const candidate = await ctx.db.query.vacancyResponse.findFirst({
      where: (response, { eq }) => eq(response.id, candidateId),
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

    if (!candidate.vacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия для кандидата не найдена",
      });
    }

    if (candidate.vacancy.workspaceId !== workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому кандидату",
      });
    }

    // Отправляем событие в Inngest для обновления резюме
    await ctx.inngest.send({
      name: "response/resume.refresh",
      data: {
        responseId: candidateId,
      },
    });

    return { success: true };
  });
