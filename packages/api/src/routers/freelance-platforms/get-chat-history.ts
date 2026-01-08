import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

const getChatHistoryInputSchema = z.object({
  conversationId: z.uuid(),
});

export const getChatHistory = publicProcedure
  .input(getChatHistoryInputSchema)
  .query(async ({ input, ctx }) => {
    // Проверяем существование conversation
    const conv = await ctx.db.query.conversation.findFirst({
      where: (conversation, { eq, and }) =>
        and(
          eq(conversation.id, input.conversationId),
          eq(conversation.source, "WEB"),
        ),
      with: {
        messages: {
          with: {
            file: true,
          },
          orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        },
      },
    });

    if (!conv) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Разговор не найден",
      });
    }

    // Логируем доступ к разговору (если пользователь авторизован)
    if (ctx.session?.user) {
      await ctx.auditLogger.logConversationAccess({
        userId: ctx.session.user.id,
        conversationId: input.conversationId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
    }

    // Форматируем сообщения для клиента с поддержкой голосовых
    const messages = await Promise.all(
      conv.messages.map(async (msg) => {
        const baseMessage = {
          id: msg.id,
          sender: msg.sender,
          content: msg.content,
          contentType: msg.contentType,
          createdAt: msg.createdAt,
          voiceTranscription: msg.voiceTranscription ?? null,
          fileUrl: null as string | null,
        };

        // Если это голосовое сообщение с файлом, генерируем URL
        if (msg.contentType === "VOICE" && msg.file) {
          baseMessage.fileUrl = await getDownloadUrl(msg.file.key);
        }

        return baseMessage;
      }),
    );

    return {
      conversationId: conv.id,
      status: conv.status,
      messages,
    };
  });
