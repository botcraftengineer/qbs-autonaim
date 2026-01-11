import { gig, gigTypeValues } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const createGigSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  type: z.enum(gigTypeValues).default("OTHER"),
  budgetMin: z.number().int().positive().optional(),
  budgetMax: z.number().int().positive().optional(),

  deadline: z.coerce.date().optional(),
  estimatedDuration: z.string().max(100).optional(),
  deliverables: z.string().optional(),
  requiredSkills: z.string().optional(),
});

export const create = protectedProcedure
  .input(createGigSchema)
  .mutation(async ({ input, ctx }) => {
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
      input.deliverables ? `\n\nЧто нужно сделать:\n${input.deliverables}` : "",
      input.requiredSkills
        ? `\n\nТребуемые навыки:\n${input.requiredSkills}`
        : "",
    ]
      .filter(Boolean)
      .join("")
      .trimStart();

    const [newGig] = await ctx.db
      .insert(gig)
      .values({
        workspaceId: input.workspaceId,
        title: input.title,
        description: fullDescription || null,
        type: input.type,
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,

        deadline: input.deadline ? new Date(input.deadline) : null,
        estimatedDuration: input.estimatedDuration,
        source: "MANUAL",
        isActive: true,
      })
      .returning();

    if (!newGig) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать задание",
      });
    }

    return newGig;
  });
