import { eq, workspaceRepository } from "@qbs-autonaim/db";
import { vacancyResponse } from "@qbs-autonaim/db/schema";
import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { sanitizeHtml } from "../../utils/sanitize-html";

export const getById = protectedProcedure
  .input(z.object({ id: z.string(), workspaceId: workspaceIdSchema }))
  .query(async ({ ctx, input }) => {
    // Проверка доступа к workspace
    const access = await workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const response = await ctx.db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, input.id),
      with: {
        vacancy: {
          with: {
            workspace: true,
          },
        },
        screening: true,
        conversation: {
          with: {
            interviewScoring: true,
            messages: {
              with: {
                file: true,
              },
              orderBy: (messages, { asc }) => [asc(messages.createdAt)],
            },
          },
        },
        resumePdfFile: true,
        telegramInterviewScoring: true,
      },
    });

    if (!response) {
      return null;
    }

    // Проверка принадлежности вакансии к workspace
    if (response.vacancy.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    let resumePdfUrl: string | null = null;
    if (response.resumePdfFile) {
      resumePdfUrl = await getDownloadUrl(response.resumePdfFile.key);
    }

    // Get voice file URLs for messages
    const messagesWithUrls = response.conversation?.messages
      ? await Promise.all(
          response.conversation.messages.map(async (message) => {
            if (message.file) {
              const voiceUrl = await getDownloadUrl(message.file.key);
              return { ...message, voiceUrl };
            }
            return message;
          }),
        )
      : undefined;

    return {
      ...response,
      resumePdfUrl,
      screening: response.screening
        ? {
            ...response.screening,
            analysis: response.screening.analysis
              ? sanitizeHtml(response.screening.analysis)
              : null,
          }
        : null,
      telegramInterviewScoring: response.telegramInterviewScoring
        ? {
            ...response.telegramInterviewScoring,
            analysis: response.telegramInterviewScoring.analysis
              ? sanitizeHtml(response.telegramInterviewScoring.analysis)
              : null,
          }
        : null,
      conversation: response.conversation
        ? {
            ...response.conversation,
            messages: messagesWithUrls,
          }
        : undefined,
    };
  });
