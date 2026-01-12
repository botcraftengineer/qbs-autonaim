import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../trpc";
import { hasInterviewAccess } from "./interview-token-validator";

/**
 * Middleware для проверки доступа к интервью
 * Добавляет проверку доступа к interviewSessionId из input
 */
export const withInterviewAccess = publicProcedure.use(
  async ({ ctx, next, input }) => {
    const inputSchema = z.object({
      interviewSessionId: z.uuid().optional(),
      sessionId: z.uuid().optional(),
    });

    const parseResult = inputSchema.safeParse(input);

    if (!parseResult.success) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Требуется interviewSessionId или sessionId",
      });
    }

    const { interviewSessionId, sessionId } = parseResult.data;
    const actualSessionId = interviewSessionId || sessionId;

    if (!actualSessionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Требуется interviewSessionId или sessionId",
      });
    }

    // Проверяем доступ к interview session
    const hasAccess = await hasInterviewAccess(
      actualSessionId,
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

    return next({
      ctx: {
        ...ctx,
        // Добавляем информацию о проверенном доступе в контекст
        verifiedInterviewSessionId: actualSessionId,
      },
    });
  },
);
