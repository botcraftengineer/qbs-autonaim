import { eq, telegramSession } from "@qbs-autonaim/db";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const sendUserMessageByPhoneRouter = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      sessionId: z.string().optional(),
      phone: z.string(),
      text: z.string().min(1),
      firstName: z.string().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    try {
      const session = input.sessionId
        ? await ctx.db.query.telegramSession.findFirst({
            where: eq(telegramSession.id, input.sessionId),
          })
        : await ctx.db.query.telegramSession.findFirst({
            where: eq(telegramSession.workspaceId, input.workspaceId),
            orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
          });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Telegram сессия не найдена. Пожалуйста, авторизуйтесь.",
        });
      }

      const result = await tgClientSDK.sendMessageByPhone({
        workspaceId: input.workspaceId,
        phone: input.phone,
        text: input.text,
        firstName: input.firstName,
      });

      await ctx.db
        .update(telegramSession)
        .set({ lastUsedAt: new Date() })
        .where(eq(telegramSession.id, session.id));

      return result;
    } catch (error) {
      console.error("❌ Ошибка отправки сообщения по телефону:", error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Не удалось отправить сообщение",
      });
    }
  });
