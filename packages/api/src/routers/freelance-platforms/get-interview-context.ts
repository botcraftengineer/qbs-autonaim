import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

const getInterviewContextInputSchema = z.object({
  conversationId: z.uuid(),
});

export const getInterviewContext = publicProcedure
  .input(getInterviewContextInputSchema)
  .query(async ({ input, ctx }) => {
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

    // Если есть responseId, загружаем вакансию
    if (conv.responseId) {
      const response = await ctx.db.query.vacancyResponse.findFirst({
        where: (vacancyResponse, { eq }) =>
          eq(vacancyResponse.id, conv.responseId ?? ""),
        with: {
          vacancy: true,
        },
      });

      if (response?.vacancy) {
        const vacancy = response.vacancy;
        return {
          type: "vacancy" as const,
          title: vacancy.title,
          description: vacancy.description,
          requirements: vacancy.requirements,
          customInterviewQuestions: vacancy.customInterviewQuestions,
        };
      }
    }

    // Если есть gigResponseId, загружаем задание
    if (conv.gigResponseId) {
      const gigResponse = await ctx.db.query.gigResponse.findFirst({
        where: (gigResponse, { eq }) =>
          eq(gigResponse.id, conv.gigResponseId ?? ""),
        with: {
          gig: true,
        },
      });

      if (gigResponse?.gig) {
        const gig = gigResponse.gig;
        return {
          type: "gig" as const,
          title: gig.title,
          description: gig.description,
          requirements: gig.requirements,
          gigType: gig.type,
          budget:
            gig.budgetMin || gig.budgetMax
              ? {
                  min: gig.budgetMin,
                  max: gig.budgetMax,
                  currency: gig.budgetCurrency,
                }
              : null,
          deadline: gig.deadline,
          estimatedDuration: gig.estimatedDuration,
          customInterviewQuestions: gig.customInterviewQuestions,
        };
      }
    }

    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Информация о вакансии или задании не найдена",
    });
  });
