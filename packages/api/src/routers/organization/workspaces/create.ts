import { organizationRepository, workspaceRepository } from "@qbs-autonaim/db";
import { optimizeLogo } from "@qbs-autonaim/lib/image";
import {
  createWorkspaceSchema,
  organizationIdSchema,
} from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const createWorkspace = protectedProcedure
  .input(
    z.object({
      organizationId: organizationIdSchema,
      workspace: createWorkspaceSchema,
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

    // Проверка уникальности slug в рамках организации
    const existing = await organizationRepository.getWorkspaceBySlug(
      input.organizationId,
      input.workspace.slug,
    );

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Workspace с таким slug уже существует в этой организации",
      });
    }

    // Оптимизация логотипа если нужно
    const dataToCreate = { ...input.workspace };
    if (dataToCreate.logo?.startsWith("data:image/")) {
      dataToCreate.logo = await optimizeLogo(dataToCreate.logo);
    }

    // Создание workspace с organizationId
    const workspace = await workspaceRepository.create({
      ...dataToCreate,
      organizationId: input.organizationId,
    });

    if (!workspace) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать workspace",
      });
    }

    // Добавление создателя как owner
    await workspaceRepository.addUser(
      workspace.id,
      ctx.session.user.id,
      "owner",
    );

    return workspace;
  });
