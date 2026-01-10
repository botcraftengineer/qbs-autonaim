import { eq } from "@qbs-autonaim/db";
import { vacancy as vacancyTable } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";
import { requireInterviewAccess } from "../../utils/interview-token-validator";

const getInterviewContextInputSchema = z.object({
  interviewSessionId: z.string().uuid(),
});

export const getInterviewContext = publicProcedure
  .input(getInterviewContextInputSchema)
  .query(async ({ input, ctx }) => {
    // Проверяем доступ к interview session
    await requireInterviewAccess(
      input.interviewSessionId,
      ctx.interviewToken,
      ctx.session?.user?.id ?? null,
      ctx.db,
    );

    const session = await ctx.db.query.interviewSession.findFirst({
      where: (interviewSession, { eq }) =>
        eq(interviewSession.id, input.interviewSessionId),
      with: {
        vacancyResponse: true,
        gigResponse: {
          with: {
            gig: true,
          },
        },
      },
    });

    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Интервью не найдено",
      });
    }

    // Если это интервью по вакансии
    if (session.vacancyResponse) {
      const vacancy = await ctx.db.query.vacancy.findFirst({
        where: eq(vacancyTable.id, session.vacancyResponse.vacancyId),
      });

      if (vacancy) {
        return {
          type: "vacancy" as const,
          title: vacancy.title,
          description: vacancy.description,
          requirements: vacancy.requirements,
          customInterviewQuestions: vacancy.customInterviewQuestions,
        };
      }
    }

    // Если это интервью по гигу
    if (session.gigResponse?.gig) {
      const gig = session.gigResponse.gig;
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

    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Информация о вакансии или задании не найдена",
    });
  });
