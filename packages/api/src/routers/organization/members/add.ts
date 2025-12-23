import { organizationRepository } from "@qbs-autonaim/db";
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const addMember = protectedProcedure
  .input(
    z.object({
      organizationId: organizationIdSchema,
      userId: z.string().min(1, "ID пользователя обязателен"),
      role: z.enum(["admin", "member"]),
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

    // Проверка прав (только owner/admin могут добавлять участников)
    if (access.role !== "owner" && access.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для добавления участников",
      });
    }

    // Добавление участника с указанной ролью
    const member = await organizationRepository.addMember(
      input.organizationId,
      input.userId,
      input.role,
    );

    return member;
  });
