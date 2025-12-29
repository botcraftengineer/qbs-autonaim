import { eq } from "@qbs-autonaim/db";
import { vacancyResponse } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const sendGreeting = protectedProcedure
  .input(
    z.object({
      candidateId: z.string().uuid(),
      workspaceId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { candidateId, workspaceId } = input;

    const candidate = await ctx.db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, candidateId),
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

    if (candidate.welcomeSentAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Приветствие уже было отправлено",
      });
    }

    // Отправляем событие в Inngest для отправки приветственного сообщения
    await ctx.inngest.send({
      name: "candidate/welcome",
      data: {
        responseId: candidateId,
        username: candidate.telegramUsername || undefined,
        phone: candidate.phone || undefined,
      },
    });

    return { success: true };
  });
