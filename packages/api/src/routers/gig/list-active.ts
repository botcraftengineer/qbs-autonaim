import { and, desc, eq } from "@qbs-autonaim/db";
import { gig } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const listActive = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .query(async ({ ctx, input }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    return ctx.db.query.gig.findMany({
      where: and(
        eq(gig.workspaceId, input.workspaceId),
        eq(gig.isActive, true),
      ),
      orderBy: [desc(gig.createdAt)],
    });
  });
