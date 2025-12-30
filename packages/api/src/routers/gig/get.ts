import { and, eq } from "@qbs-autonaim/db";
import { gig } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const get = protectedProcedure
  .input(z.object({ id: z.string().uuid(), workspaceId: workspaceIdSchema }))
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

    return ctx.db.query.gig.findFirst({
      where: and(eq(gig.id, input.id), eq(gig.workspaceId, input.workspaceId)),
    });
  });
