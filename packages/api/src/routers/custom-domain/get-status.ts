/**
 * Get Domain Status Procedure
 *
 * Получает полный статус кастомного домена.
 * Защищённая процедура - требует авторизации.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  CustomDomainError,
  CustomDomainService,
} from "../../services/custom-domain";
import { protectedProcedure } from "../../trpc";

const getStatusInputSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  domainId: z.uuid("Некорректный ID домена").optional(),
});

export const getStatus = protectedProcedure
  .input(getStatusInputSchema)
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

    const customDomainService = new CustomDomainService(ctx.db);

    try {
      // If domainId is provided, get specific domain status
      if (input.domainId) {
        const status = await customDomainService.getDomainStatus(
          input.domainId,
          input.workspaceId,
        );
        return status;
      }

      // Otherwise, get domain for workspace
      const config = await customDomainService.getDomainByWorkspace(
        input.workspaceId,
      );

      if (!config) {
        return {
          config: null,
          dnsStatus: null,
          sslStatus: null,
          ready: false,
          nextSteps: ["Зарегистрируйте кастомный домен для вашего виджета"],
        };
      }

      const status = await customDomainService.getDomainStatus(
        config.id,
        input.workspaceId,
      );

      return status;
    } catch (error) {
      if (error instanceof CustomDomainError) {
        if (error.code === "DOMAIN_NOT_FOUND") {
          return {
            config: null,
            dnsStatus: null,
            sslStatus: null,
            ready: false,
            nextSteps: ["Зарегистрируйте кастомный домен для вашего виджета"],
          };
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.userMessage,
          cause: error,
        });
      }
      throw error;
    }
  });
