import { organizationRepository } from "@qbs-autonaim/db";
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
    const access = await organizationRepository.checkAccess(
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
    const workspace = await organizationRepository.getWorkspaceBySlug(
      input.organizationId,
      input.slug,
    );

    if (!workspace) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workspace не найден",
      });
    }

    // Дополнительная валидация что workspace принадлежит организации
    if (workspace.organizationId !== input.organizationId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Workspace не принадлежит этой организации",
      });
    }

    return workspace;
  });
