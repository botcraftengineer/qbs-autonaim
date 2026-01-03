/**
 * Get Session Procedure
 *
 * Получает текущее состояние сессии преквалификации.
 * Публичная процедура - не требует авторизации пользователя.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { SessionManager } from "../../services/prequalification";
import { publicProcedure } from "../../trpc";

const getSessionInputSchema = z.object({
  sessionId: z.string().uuid("sessionId должен быть UUID"),
  workspaceId: z.string().min(1, "workspaceId обязателен"),
});

export const getSession = publicProcedure
  .input(getSessionInputSchema)
  .query(async ({ ctx, input }) => {
    const sessionManager = new SessionManager(ctx.db);

    const session = await sessionManager.getSession(
      input.sessionId,
      input.workspaceId,
    );

    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Сессия не найдена",
      });
    }

    return {
      id: session.id,
      status: session.status,
      vacancyId: session.vacancyId,
      hasResume: !!session.parsedResume,
      hasConversation: !!session.conversationId,
      fitScore: session.fitScore,
      fitDecision: session.fitDecision,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  });
