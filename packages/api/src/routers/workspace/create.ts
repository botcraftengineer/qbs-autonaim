import { organizationRepository, workspaceRepository } from "@qbs-autonaim/db";
import { optimizeLogo } from "@qbs-autonaim/lib/image";
import {
  createWorkspaceSchema,
  organizationIdSchema,
} from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const create = protectedProcedure
  .input(
    z.object({
      organizationId: organizationIdSchema.optional(),
      workspace: createWorkspaceSchema,
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const organizations = await organizationRepository.getUserOrganizations(
      ctx.session.user.id,
    );

    if (!organizations.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "У пользователя нет организаций",
      });
    }

    let organizationId: string;

    if (input.organizationId) {
      // Validate that the provided organizationId belongs to the user
      const hasAccess = organizations.some(
        (org) => org.id === input.organizationId,
      );

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Нет доступа к указанной организации",
        });
      }

      organizationId = input.organizationId;
    } else {
      // Fallback to first organization if organizationId is omitted
      const firstOrg = organizations[0];
      if (!firstOrg) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "У пользователя нет организаций",
        });
      }
      organizationId = firstOrg.id;
    }

    const existing = await workspaceRepository.findBySlug(
      input.workspace.slug,
      organizationId,
    );
    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Workspace с таким slug уже существует",
      });
    }

    const dataToCreate = { ...input.workspace };
    if (dataToCreate.logo?.startsWith("data:image/")) {
      dataToCreate.logo = await optimizeLogo(dataToCreate.logo);
    }

    const workspace = await workspaceRepository.create({
      ...dataToCreate,
      organizationId,
    });

    if (!workspace || !workspace.id) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать workspace",
      });
    }

    await workspaceRepository.addUser(
      workspace.id,
      ctx.session.user.id,
      "owner",
    );

    return workspace;
  });
