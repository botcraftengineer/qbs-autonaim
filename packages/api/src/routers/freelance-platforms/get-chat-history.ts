import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";
import { requireInterviewAccess } from "../../utils/interview-token-validator";

const getChatHistoryInputSchema = z.object({
  interviewSessionId: z.string().uuid(),
});

export const getChatHistory = publicProcedure
  .input(getChatHistoryInputSchema)
  .query(async ({ input, ctx }) => {
    // Проверяем доступ к interview session
    await requireInterviewAccess(
      input.interviewSessionId,
      ctx.interviewToken,
      ctx.session?.user?.id ?? null,
      ctx.db,
    );

    // Проверяем существование interview session
    const session = await ctx.db.query.interviewSession.findFirst({
      where: (interviewSession, { eq }) =>
        eq(interviewSession.id, input.interviewSessionId),
      with: {
        messages: {
          with: {
            file: true,
          },
          orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        },
      },
    });

    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Интервью не найдено",
      });
    }

    // Логируем доступ к интервью (если пользователь авторизован)
    if (ctx.session?.user) {
      await ctx.auditLogger.logInterviewAccess({
        userId: ctx.session.user.id,
        interviewSessionId: input.interviewSessionId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
    }

    // Форматируем сообщения для клиента с поддержкой голосовых
    const messages = await Promise.all(
      session.messages.map(async (msg) => {
        const baseMessage = {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          type: msg.type,
          createdAt: msg.createdAt,
          voiceTranscription: msg.voiceTranscription ?? null,
          fileUrl: null as string | null,
        };

        // Если это голосовое сообщение с файлом, генерируем URL
        if (msg.type === "voice" && msg.file) {
          baseMessage.fileUrl = await getDownloadUrl(msg.file.key);
        }

        return baseMessage;
      }),
    );

    return {
      interviewSessionId: session.id,
      status: session.status,
      messages,
    };
  });
