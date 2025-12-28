import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { InterviewLinkGenerator } from "../../services";
import { publicProcedure } from "../../trpc";

const validateInterviewTokenInputSchema = z.object({
  token: z.string().uuid(),
});

export const validateInterviewToken = publicProcedure
  .input(validateInterviewTokenInputSchema)
  .query(async ({ input }) => {
    // Валидируем токен через сервис
    const linkGenerator = new InterviewLinkGenerator();
    const interviewLink = await linkGenerator.validateLink(input.token);

    if (!interviewLink) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ссылка на интервью недействительна или истекла",
      });
    }

    return {
      id: interviewLink.id,
      vacancyId: interviewLink.vacancyId,
      token: interviewLink.token,
      url: interviewLink.url,
      isActive: interviewLink.isActive,
      createdAt: interviewLink.createdAt,
      expiresAt: interviewLink.expiresAt,
    };
  });
