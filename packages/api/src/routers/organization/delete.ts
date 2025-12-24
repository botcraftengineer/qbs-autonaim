import { organizationRepository } from "@qbs-autonaim/db";
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const deleteOrganization = protectedProcedure
  .input(z.object({ id: organizationIdSchema }))
  .mutation(async ({ input, ctx }) => {
    const access = await organizationRepository.checkAccess(
      input.id,
      ctx.session.user.id,
    );

    if (!access || access.role !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Только owner может удалить организацию",
      });
    }

    await organizationRepository.delete(input.id);
    return { success: true };
  });
