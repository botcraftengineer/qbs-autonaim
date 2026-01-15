import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const getBotSettings = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .query(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    const botSettings = await ctx.db.query.botSettings.findFirst({
      where: (botSettings, { eq }) =>
        eq(botSettings.workspaceId, input.workspaceId),
    });

    return botSettings;
  });
