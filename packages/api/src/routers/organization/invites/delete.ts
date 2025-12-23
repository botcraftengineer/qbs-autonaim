import { organizationRepository } from "@qbs-autonaim/db";
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const deleteInvite = protectedProcedure
  .input(
    z.object({
      organizationId: organizationIdSchema,
      inviteId: z.string().min(1, "ID приглашения обязателен"),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // Проверка доступа к организации
    const access = await organizationRepository.checkAccess(
      input.organizationId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к организации",
      });
    }

    // Проверка прав (только owner/admin могут отменять приглашения)
    if (access.role !== "owner" && access.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для отмены приглашений",
      });
    }

    // Отмена приглашения
    await organizationRepository.deleteInvite(input.inviteId);

    return { success: true };
  });
