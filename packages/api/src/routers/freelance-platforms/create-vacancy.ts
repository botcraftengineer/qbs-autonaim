import { vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { InterviewLinkGenerator } from "../../services";
import { protectedProcedure } from "../../trpc";

const createVacancyInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  requirements: z.string().optional(),
  platformSource: z.enum([
    "kwork",
    "fl",
    "weblancer",
    "upwork",
    "freelancer",
    "fiverr",
  ]),
  platformUrl: z.string().url().optional(),
});

export const createVacancy = protectedProcedure
  .input(createVacancyInputSchema)
  .mutation(async ({ input, ctx }) => {
    // Проверка доступа к workspace
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

    // Создаём вакансию
    const [createdVacancy] = await ctx.db
      .insert(vacancy)
      .values({
        workspaceId: input.workspaceId,
        title: input.title,
        description: input.description,
        source: input.platformSource,
        url: input.platformUrl,
        isActive: true,
      })
      .returning();

    if (!createdVacancy) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать вакансию",
      });
    }

    // Генерируем ссылку на интервью
    const linkGenerator = new InterviewLinkGenerator();
    const interviewLink = await linkGenerator.generateLink(createdVacancy.id);

    return {
      vacancy: createdVacancy,
      interviewLink: {
        url: interviewLink.url,
        token: interviewLink.token,
        isActive: interviewLink.isActive,
      },
    };
  });
