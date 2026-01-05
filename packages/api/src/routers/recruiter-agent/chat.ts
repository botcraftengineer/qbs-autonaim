/**
 * Chat procedure для AI-ассистента рекрутера
 *
 * Реализует streaming диалог с агентом через SSE
 * Requirements: 1.1, 1.2, 1.3, 7.5, 10.2
 */

import {
  type ConversationMessage,
  createFeedbackHistory,
  mapDBSettingsToRecruiterSettings,
  RecruiterAgentOrchestrator,
  type RecruiterFeedbackEntry,
  type RecruiterFeedbackStats,
  type RecruiterStreamEvent,
} from "@qbs-autonaim/ai";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import {
  calculateUserFeedbackStats,
  loadUserFeedbackHistory,
} from "./feedback";
import { checkRateLimit, checkWorkspaceAccess } from "./middleware";

/**
 * Схема сообщения в истории диалога
 */
const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.coerce.date(),
  metadata: z
    .object({
      intent: z
        .enum([
          "SEARCH_CANDIDATES",
          "ANALYZE_VACANCY",
          "GENERATE_CONTENT",
          "COMMUNICATE",
          "CONFIGURE_RULES",
          "GENERAL_QUESTION",
        ])
        .optional(),
      actions: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Схема входных данных для chat
 */
const chatInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  message: z.string().min(1).max(5000),
  vacancyId: z.string().optional(),
  conversationHistory: z.array(conversationMessageSchema).max(20).default([]),
});

/**
 * Chat procedure с streaming через SSE
 */
export const chat = protectedProcedure
  .input(chatInputSchema)
  .subscription(async function* ({ input, ctx }) {
    const { workspaceId, message, vacancyId, conversationHistory } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      ctx.workspaceRepository,
      workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Проверка rate limiting (30 запросов в минуту)
    const rateLimitKey = `chat:${workspaceId}`;
    const canProceed = await checkRateLimit(rateLimitKey, 30, 60);

    if (!canProceed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Превышен лимит запросов. Попробуйте через минуту.",
      });
    }

    // Загружаем настройки компании (Requirements: 7.5)
    const companySettings = await ctx.db.query.companySettings.findFirst({
      where: (cs, { eq }) => eq(cs.workspaceId, workspaceId),
    });

    // Преобразуем настройки из БД в формат для агентов
    const recruiterCompanySettings = mapDBSettingsToRecruiterSettings(
      companySettings
        ? {
            id: companySettings.id,
            workspaceId: companySettings.workspaceId,
            name: companySettings.name,
            website: companySettings.website,
            description: companySettings.description,
            botName: companySettings.botName,
            botRole: companySettings.botRole,
          }
        : null,
    );

    // Загружаем историю feedback для влияния на рекомендации (Requirements: 10.2)
    const [feedbackEntries, feedbackStats] = await Promise.all([
      loadUserFeedbackHistory(ctx.db, workspaceId, ctx.session.user.id, 50),
      calculateUserFeedbackStats(ctx.db, workspaceId, ctx.session.user.id),
    ]);

    // Преобразуем в формат для агента
    const feedbackHistory = createFeedbackHistory(
      feedbackEntries as RecruiterFeedbackEntry[],
      feedbackStats as RecruiterFeedbackStats,
    );

    // Создаём оркестратор
    const model = getAIModel();
    const orchestrator = new RecruiterAgentOrchestrator({
      model,
      maxSteps: 10,
      maxConversationHistory: 20,
      enableStreaming: true,
    });

    // Преобразуем историю в нужный формат
    const history: ConversationMessage[] = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      metadata: msg.metadata,
    }));

    // Выполняем запрос с streaming
    const events: RecruiterStreamEvent[] = [];

    try {
      const output = await orchestrator.executeWithStreaming(
        {
          message,
          workspaceId,
          vacancyId,
          conversationHistory: history,
        },
        recruiterCompanySettings,
        (event: RecruiterStreamEvent) => {
          events.push(event);
        },
      );

      // Отправляем все события
      for (const event of events) {
        yield event;
      }

      // Логируем в audit log
      await ctx.auditLogger.logAccess({
        userId: ctx.session.user.id,
        workspaceId,
        action: "ACCESS",
        resourceType: "VACANCY",
        resourceId: workspaceId,
        metadata: {
          type: "recruiter_agent_chat",
          intent: output.intent,
          actionsCount: output.actions.length,
          vacancyId,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      // Отправляем событие ошибки
      yield {
        type: "error" as const,
        timestamp: new Date(),
        error: errorMessage,
        code: "ORCHESTRATOR_ERROR",
      };

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось обработать запрос. Попробуйте позже.",
      });
    }
  });
