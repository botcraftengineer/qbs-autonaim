/**
 * Delete Domain Procedure
 *
 * Удаляет кастомный домен.
 * Защищённая процедура - требует авторизации и прав администратора.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { CustomDomainService } from "../../services/custom-domain";
import { protectedProcedure } from "../../trpc";

const deleteDomainInputSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  domainId: z.string().uuid("Некорректный ID домена"),
});

export const deleteDomain = protectedProcedure
  .input(deleteDomainInputSchema)
  .mutation(async ({ ctx, input }) => {
    // Verify user has access to workspace
    const membership = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Check if user has admin role
    if (membership.role !== "admin" && membership.role !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Только администраторы могут управлять доменами",
      });
    }

    const customDomainService = new CustomDomainService(ctx.db);

    // Get domain info before deletion for audit log
    const config = await customDomainService.getDomain(
      input.domainId,
      input.workspaceId,
    );

    if (!config) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Домен не найден",
      });
    }

    const deleted = await customDomainService.deleteDomain(
      input.domainId,
      input.workspaceId,
    );

    if (!deleted) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Домен не найден",
      });
    }

    // Log audit event
    await ctx.auditLogger.logAccess({
      userId: ctx.session.user.id,
      action: "ACCESS",
      resourceType: "VACANCY", // Using existing enum value
      resourceId: input.domainId,
      metadata: {
        type: "custom_domain_delete",
        workspaceId: input.workspaceId,
        domain: config.domain,
      },
    });

    return {
      success: true,
      message: "Домен успешно удалён",
    };
  });
