/**
 * Register Domain Procedure
 *
 * Регистрирует новый кастомный домен для workspace.
 * Защищённая процедура - требует авторизации и прав администратора.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  CustomDomainError,
  CustomDomainService,
  generateDNSInstructions,
} from "../../services/custom-domain";
import { protectedProcedure } from "../../trpc";

const registerDomainInputSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  domain: z
    .string()
    .min(1, "Домен обязателен")
    .max(255, "Домен слишком длинный")
    .transform((val) => val.toLowerCase().trim()),
});

export const registerDomain = protectedProcedure
  .input(registerDomainInputSchema)
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
      const config = await customDomainService.registerDomain({
        workspaceId: input.workspaceId,
        domain: input.domain,
      });

      // Generate DNS instructions for the user
      const instructions = generateDNSInstructions(config.domain);

      // Log audit event
      await ctx.auditLogger.logAccess({
        userId: ctx.session.user.id,
        action: "ACCESS",
        resourceType: "VACANCY", // Using existing enum value
        resourceId: config.id,
        metadata: {
          type: "custom_domain_register",
          workspaceId: input.workspaceId,
          domain: config.domain,
        },
      });

      return {
        success: true,
        config,
        instructions,
      };
    } catch (error) {
      if (error instanceof CustomDomainError) {
        const codeMap: Record<
          string,
          "BAD_REQUEST" | "CONFLICT" | "NOT_FOUND"
        > = {
          DOMAIN_ALREADY_USED: "CONFLICT",
          INVALID_DOMAIN_FORMAT: "BAD_REQUEST",
          DATABASE_ERROR: "BAD_REQUEST",
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
