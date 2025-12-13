import { workspaceRepository } from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const getLink = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .query(async ({ input, ctx }) => {
    const access = await workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    const invite = await workspaceRepository.getActiveInviteLink(
      input.workspaceId,
    );

    return invite;
  });
