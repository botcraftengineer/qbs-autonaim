import { organizationIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const getWorkspaceBySlug = protectedProcedure
  .input(
    z.object({
      organizationId: organizationIdSchema,
      slug: z.string().min(1),
    }),
  )
  .query(async ({ input, ctx }) => {
    // Проверка доступа к организации
    const access = await ctx.organizationRepository.checkAccess(
      input.organizationId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к организации",
      });
    }

    // Получение workspace по slug
    const workspace = await ctx.organizationRepository.getWorkspaceBySlug(
      input.organizationId,
      input.slug,
    );

    if (!workspace) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workspace не найден",
      });
    }

    return workspace;
  });
