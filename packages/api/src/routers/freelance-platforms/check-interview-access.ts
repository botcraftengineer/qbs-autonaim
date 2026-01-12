import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";
import { hasInterviewAccess } from "../../utils/interview-token-validator";

const checkInterviewAccessInputSchema = z.object({
  interviewSessionId: z.uuid(),
});

export const checkInterviewAccess = publicProcedure
  .input(checkInterviewAccessInputSchema)
  .query(async ({ input, ctx }) => {
    // Проверяем доступ к interview session
    const hasAccess = await hasInterviewAccess(
      input.interviewSessionId,
      ctx.interviewToken,
      ctx.session?.user?.id ?? null,
      ctx.db,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому интервью",
      });
    }

    // Получаем базовую информацию о сессии для подтверждения доступа
    const session = await ctx.db.query.interviewSession.findFirst({
      where: (interviewSession, { eq }) =>
        eq(interviewSession.id, input.interviewSessionId),
      columns: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Интервью не найдено",
      });
    }

    return {
      hasAccess: true,
      sessionId: session.id,
      status: session.status,
      createdAt: session.createdAt,
    };
  });
