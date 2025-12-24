import { and, count, eq } from "@qbs-autonaim/db";
import { vacancy, vacancyResponse } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const getCount = protectedProcedure
  .input(
    z.object({
      vacancyId: z.string(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .query(async ({ ctx, input }) => {
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

    // Проверка принадлежности вакансии к workspace
    const vacancyCheck = await ctx.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, input.vacancyId),
        eq(vacancy.workspaceId, input.workspaceId),
      ),
    });

    if (!vacancyCheck) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    const result = await ctx.db
      .select({ count: count() })
      .from(vacancyResponse)
      .where(eq(vacancyResponse.vacancyId, input.vacancyId));

    return { total: result[0]?.count ?? 0 };
  });
