import { vacancy } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const createVacancySchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  conditions: z.string().optional(),
});

export const create = protectedProcedure
  .input(createVacancySchema)
  .mutation(async ({ input, ctx }) => {
    // Проверка доступа к workspace
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Формируем description из всех полей
    const fullDescription = [
      input.description,
      input.requirements ? `\n\nТребования:\n${input.requirements}` : "",
      input.responsibilities
        ? `\n\nОбязанности:\n${input.responsibilities}`
        : "",
      input.conditions ? `\n\nУсловия:\n${input.conditions}` : "",
    ]
      .filter(Boolean)
      .join("");

    // Создание вакансии
    const [newVacancy] = await ctx.db
      .insert(vacancy)
      .values({
        workspaceId: input.workspaceId,
        title: input.title,
        description: fullDescription || null,
        source: "manual",
        isActive: true,
      })
      .returning();

    if (!newVacancy) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать вакансию",
      });
    }

    return newVacancy;
  });
