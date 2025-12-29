import { messageBufferService } from "@qbs-autonaim/jobs/services/buffer";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

const getWebInterviewStatusInputSchema = z.object({
  conversationId: z.string().uuid(),
});

export const getWebInterviewStatus = publicProcedure
  .input(getWebInterviewStatusInputSchema)
  .query(async ({ input, ctx }) => {
    // Проверяем существование conversation
    const conv = await ctx.db.query.conversation.findFirst({
      where: (conversation, { eq, and }) =>
        and(
          eq(conversation.id, input.conversationId),
          eq(conversation.source, "WEB"),
        ),
    });

    if (!conv) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Разговор не найден",
      });
    }

    // Получаем текущий номер вопроса из метаданных
    const metadata = (conv.metadata as Record<string, unknown>) || {};
    const questionAnswers =
      (metadata.questionAnswers as Array<{
        question: string;
        answer: string;
      }>) || [];
    const interviewStep = questionAnswers.length + 1;

    // Проверяем наличие активного буфера
    const hasActiveBuffer = await messageBufferService.hasBuffer({
      userId: conv.username || "web_user",
      conversationId: input.conversationId,
      interviewStep,
    });

    return {
      conversationId: conv.id,
      status: conv.status,
      hasActiveBuffer,
      interviewStep,
      questionCount: questionAnswers.length,
    };
  });
