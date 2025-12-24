
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const getBySlug = protectedProcedure
  .input(z.object({ slug: z.string() }))
  .query(async ({ input, ctx }) => {
    const organization = await ctx.organizationRepository.findBySlug(input.slug);

    if (!organization) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Организация не найдена",
      });
    }

    const access = await ctx.organizationRepository.checkAccess(
      organization.id,
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
