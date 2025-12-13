import { workspaceRepository } from "@qbs-autonaim/db";
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
    const access = await workspaceRepository.checkAccess(
      input.id,
      ctx.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для обновления workspace",
      });
    }

    if (input.data.slug) {
      const existing = await workspaceRepository.findBySlug(input.data.slug);
      if (existing && existing.id !== input.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Workspace с таким slug уже существует",
        });
      }
    }

    const dataToUpdate = { ...input.data };
    if (dataToUpdate.logo?.startsWith("data:image/")) {
      const { optimizeLogo } = await import("@qbs-autonaim/lib/image");
      dataToUpdate.logo = await optimizeLogo(dataToUpdate.logo);
    }

    const updated = await workspaceRepository.update(input.id, dataToUpdate);
    return updated;
  });
