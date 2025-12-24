
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const get = protectedProcedure
  .input(z.object({ id: organizationIdSchema }))
  .query(async ({ input, ctx }) => {
    const organization = await ctx.organizationRepository.findById(input.id);

    if (!organization) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Организация не найдена",
      });
    }

    const access = await ctx.organizationRepository.checkAccess(
      input.id,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к организации",
      });
    }

    return organization;
  });
