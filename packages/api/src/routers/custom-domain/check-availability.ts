/**
 * Check Domain Availability Procedure
 *
 * Проверяет, доступен ли домен для регистрации.
 * Защищённая процедура - требует авторизации.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { CustomDomainService } from "../../services/custom-domain";
import { isValidDomainFormat } from "../../services/custom-domain/dns-verifier";
import { protectedProcedure } from "../../trpc";

const checkAvailabilityInputSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  domain: z
    .string()
    .min(1, "Домен обязателен")
    .max(255, "Домен слишком длинный")
    .transform((val) => val.toLowerCase().trim()),
});

export const checkAvailability = protectedProcedure
  .input(checkAvailabilityInputSchema)
  .query(async ({ ctx, input }) => {
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

    // Validate domain format
    if (!isValidDomainFormat(input.domain)) {
      return {
        available: false,
        domain: input.domain,
        reason: "Неверный формат домена",
      };
    }

    const customDomainService = new CustomDomainService(ctx.db);

    // Check if domain is available (excluding current workspace)
    const available = await customDomainService.isDomainAvailable(
      input.domain,
      input.workspaceId,
    );

    return {
      available,
      domain: input.domain,
      reason: available ? null : "Домен уже используется другой компанией",
    };
  });
