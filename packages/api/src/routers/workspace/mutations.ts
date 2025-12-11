import { workspaceRepository } from "@qbs-autonaim/db";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const workspaceMutations = {
  // Создать workspace
  create: protectedProcedure
    .input(createWorkspaceSchema)
    .mutation(async ({ input, ctx }) => {
      // Проверка уникальности slug
      const existing = await workspaceRepository.findBySlug(input.slug);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Workspace с таким slug уже существует",
        });
      }

      // Оптимизируем логотип, если он передан
      const dataToCreate = { ...input };
      if (dataToCreate.logo?.startsWith("data:image/")) {
        const { optimizeLogo } = await import("@qbs-autonaim/lib/image");
        dataToCreate.logo = await optimizeLogo(dataToCreate.logo);
      }

      // Создать workspace
      const workspace = await workspaceRepository.create(dataToCreate);

      if (!workspace) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось создать workspace",
        });
      }

      // Добавить создателя как owner
      await workspaceRepository.addUser(
        workspace.id,
        ctx.session.user.id,
        "owner",
      );

      return workspace;
    }),

  // Обновить workspace
  update: protectedProcedure
    .input(
      z.object({
        id: workspaceIdSchema,
        data: updateWorkspaceSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Проверка доступа
      const access = await workspaceRepository.checkAccess(
        input.id,
        ctx.session.user.id,
      );

      if (!access || (access.role !== "owner" && access.role !== "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Недостаточно прав для обновления workspace",
        });
      }

      // Проверка уникальности slug
      if (input.data.slug) {
        const existing = await workspaceRepository.findBySlug(input.data.slug);
        if (existing && existing.id !== input.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Workspace с таким slug уже существует",
          });
        }
      }

      // Оптимизируем логотип, если он передан
      const dataToUpdate = { ...input.data };
      if (dataToUpdate.logo?.startsWith("data:image/")) {
        const { optimizeLogo } = await import("@qbs-autonaim/lib/image");
        dataToUpdate.logo = await optimizeLogo(dataToUpdate.logo);
      }

      const updated = await workspaceRepository.update(input.id, dataToUpdate);
      return updated;
    }),

  // Удалить workspace
  delete: protectedProcedure
    .input(z.object({ id: workspaceIdSchema }))
    .mutation(async ({ input, ctx }) => {
      // Проверка доступа
      const access = await workspaceRepository.checkAccess(
        input.id,
        ctx.session.user.id,
      );

      if (!access || access.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Только owner может удалить workspace",
        });
      }

      await workspaceRepository.delete(input.id);
      return { success: true };
    }),
};
