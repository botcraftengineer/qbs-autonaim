import { eq } from "@qbs-autonaim/db";
import { gigResponse } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const evaluate = protectedProcedure
  .input(
    z.object({
      responseId: z.string().uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const response = await ctx.db.query.gigResponse.findFirst({
      where: eq(gigResponse.id, input.responseId),
      with: {
        gig: true,
      },
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    if (response.gig.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    const conversationData = await ctx.db.query.conversation.findFirst({
      where: (conversation, { eq, and }) =>
        and(
          eq(conversation.gigResponseId, input.responseId),
          eq(conversation.source, "WEB"),
        ),
    });

    if (!conversationData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Диалог не найден для этого отклика",
      });
    }

    const env = process.env;
    if (!env.INNGEST_EVENT_KEY) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Сервис оценки недоступен",
      });
    }

    if (!env.INNGEST_EVENT_API_BASE_URL) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Сервис оценки недоступен",
      });
    }

    // Validate URL format
    try {
      new URL(env.INNGEST_EVENT_API_BASE_URL);
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Сервис оценки недоступен",
      });
    }

    try {
      const response = await fetch(
        `${env.INNGEST_EVENT_API_BASE_URL}/e/${env.INNGEST_EVENT_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "gig/response.evaluate",
            data: {
              responseId: input.responseId,
              workspaceId: input.workspaceId,
              conversationId: conversationData.id,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Ошибка отправки события оценки:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          responseId: input.responseId,
          workspaceId: input.workspaceId,
          conversationId: conversationData.id,
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Не удалось запустить оценку: HTTP ${response.status} ${response.statusText}`,
        });
      }

      return {
        success: true,
        message: "Оценка запущена",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Ошибка отправки события оценки:", {
        error,
        responseId: input.responseId,
        workspaceId: input.workspaceId,
        conversationId: conversationData.id,
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось запустить оценку",
      });
    }
  });
