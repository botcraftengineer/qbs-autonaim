import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ShortlistGenerator } from "../../services";
import { protectedProcedure } from "../../trpc";

const getShortlistInputSchema = z.object({
  vacancyId: z.string().uuid(),
  workspaceId: workspaceIdSchema,
  minScore: z.number().int().min(0).max(100).optional().default(60),
  maxCandidates: z.number().int().min(1).max(100).optional().default(10),
  sortBy: z
    .enum(["SCORE", "EXPERIENCE", "RESPONSE_DATE"])
    .optional()
    .default("SCORE"),
});

export const getShortlist = protectedProcedure
  .input(getShortlistInputSchema)
  .query(async ({ input, ctx }) => {
    // Проверяем доступ к workspace
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Проверяем существование вакансии и принадлежность к workspace
    const vacancy = await ctx.db.query.vacancy.findFirst({
      where: (vacancy, { eq, and }) =>
        and(
          eq(vacancy.id, input.vacancyId),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
    });

    if (!vacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Генерируем шортлист
    const generator = new ShortlistGenerator();
    const shortlist = await generator.generateShortlist(input.vacancyId, {
      minScore: input.minScore,
      maxCandidates: input.maxCandidates,
      sortBy: input.sortBy,
    });

    return shortlist;
  });
