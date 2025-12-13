import { workspaceRepository } from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const get = protectedProcedure
  .input(z.object({ id: workspaceIdSchema }))
  .query(async ({ input, ctx }) => {
    const workspace = await workspaceRepository.findById(input.id);

    if (!workspace) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workspace не найден",
      });
    }

    const access = await workspaceRepository.checkAccess(
      input.id,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    return workspace;
  });
