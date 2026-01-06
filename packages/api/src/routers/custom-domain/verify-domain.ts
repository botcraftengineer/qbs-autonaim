/**
 * Verify Domain Procedure
 *
 * Верифицирует DNS для кастомного домена и провизионирует SSL.
 * Защищённая процедура - требует авторизации и прав администратора.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  CustomDomainError,
  CustomDomainService,
} from "../../services/custom-domain";
import { protectedProcedure } from "../../trpc";

const verifyDomainInputSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  domainId: z.uuid("Некорректный ID домена"),
});

export const verifyDomain = protectedProcedure
  .input(verifyDomainInputSchema)
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

    try {
      const config = await customDomainService.verifyAndProvision(
        input.domainId,
        input.workspaceId,
      );

      // Log audit event
      await ctx.auditLogger.logAccess({
        userId: ctx.session.user.id,
        action: "UPDATE",
        resourceType: "VACANCY", // Using existing enum value
        resourceId: config.id,
        metadata: {
          type: "custom_domain_verify",
          workspaceId: input.workspaceId,
          domain: config.domain,
          verified: config.verified,
          sslStatus: config.sslStatus,
        },
      });

      return {
        success: true,
        config,
        message: config.verified
          ? "DNS верифицирован. SSL сертификат запрошен."
          : "DNS не верифицирован",
      };
    } catch (error) {
      if (error instanceof CustomDomainError) {
        const codeMap: Record<
          string,
          "BAD_REQUEST" | "NOT_FOUND" | "TOO_MANY_REQUESTS"
        > = {
          DOMAIN_NOT_FOUND: "NOT_FOUND",
          DNS_VERIFICATION_FAILED: "BAD_REQUEST",
          VERIFICATION_IN_PROGRESS: "TOO_MANY_REQUESTS",
          SSL_PROVISION_FAILED: "BAD_REQUEST",
        };

        throw new TRPCError({
          code: codeMap[error.code] ?? "BAD_REQUEST",
          message: error.userMessage,
          cause: error,
        });
      }
      throw error;
    }
  });
