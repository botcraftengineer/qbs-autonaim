import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const createLink = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      role: z.enum(["owner", "admin", "member"]).default("member"),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для создания приглашений",
      });
    }

    const invite = await ctx.workspaceRepository.createInviteLink(
      input.workspaceId,
      ctx.session.user.id,
      input.role,
    );

    return invite;
  });
