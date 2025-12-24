
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const getBySlug = protectedProcedure
  .input(
    z.object({
      slug: z.string(),
      organizationId: z.string(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const workspace = await ctx.workspaceRepository.findBySlug(
      input.slug,
      input.organizationId,
    );

    if (!workspace) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workspace не найден",
      });
    }

    const access = await ctx.workspaceRepository.checkAccess(
      workspace.id,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    return { workspace, role: access.role };
  });
