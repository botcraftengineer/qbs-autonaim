import { user } from "@qbs-autonaim/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const setActiveWorkspace = protectedProcedure
  .input(
    z.object({
      organizationId: z.string(),
      workspaceId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    await ctx.db
      .update(user)
      .set({
        lastActiveOrganizationId: input.organizationId,
        lastActiveWorkspaceId: input.workspaceId,
      })
      .where(eq(user.id, ctx.session.user.id));

    return { success: true };
  });
