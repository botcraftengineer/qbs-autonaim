import { eq } from "@selectio/db";
import { companySettings } from "@selectio/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const get = protectedProcedure
  .input(z.object({ workspaceId: z.string().regex(/^ws_[0-9a-f]{32}$/) }))
  .query(async ({ ctx, input }) => {
    const result = await ctx.db.query.companySettings.findFirst({
      where: eq(companySettings.workspaceId, input.workspaceId),
    });

    if (!result) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Настройки компании не найдены",
      });
    }

    return result;
  });
