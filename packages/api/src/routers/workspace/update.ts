import { optimizeLogo } from "@qbs-autonaim/lib/image";
import {
  updateWorkspaceSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const update = protectedProcedure
  .input(
    z.object({
      id: workspaceIdSchema,
      data: updateWorkspaceSchema,
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.id,
      ctx.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для обновления workspace",
      });
    }

    // Получаем текущий workspace для проверки organizationId
    const currentWorkspace = await ctx.workspaceRepository.findById(input.id);
    if (!currentWorkspace) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workspace не найден",
      });
    }

    if (input.data.slug) {
      const existing = await ctx.workspaceRepository.findBySlug(
        input.data.slug,
        currentWorkspace.organizationId,
      );
      if (existing && existing.id !== input.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Workspace с таким slug уже существует",
        });
      }
    }

    const dataToUpdate = { ...input.data };
    if (dataToUpdate.logo?.startsWith("data:image/")) {
      dataToUpdate.logo = await optimizeLogo(dataToUpdate.logo);
    } else if (dataToUpdate.logo === null) {
      dataToUpdate.logo = null;
    }

    const updated = await ctx.workspaceRepository.update(
      input.id,
      dataToUpdate,
    );
    return updated;
  });
