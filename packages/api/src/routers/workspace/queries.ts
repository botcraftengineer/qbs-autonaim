import { workspaceRepository } from "@selectio/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const workspaceQueries = {
  // Получить все workspaces пользователя
  list: protectedProcedure.query(async ({ ctx }) => {
    const workspaces = await workspaceRepository.findByUserId(
      ctx.session.user.id,
    );
    return workspaces;
  }),

  // Получить workspace по ID
  byId: protectedProcedure
    .input(z.object({ id: z.string().regex(/^ws_[0-9a-f]{32}$/) }))
    .query(async ({ input, ctx }) => {
      const workspace = await workspaceRepository.findById(input.id);

      if (!workspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace не найден",
        });
      }

      // Проверка доступа
      const access = await workspaceRepository.checkAccess(
        input.id,
        ctx.session.user.id,
      );

      if (!access) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Нет доступа к workspace",
        });
      }

      return workspace;
    }),

  // Получить workspace по slug
  bySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspace = await workspaceRepository.findBySlug(input.slug);

      if (!workspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace не найден",
        });
      }

      // Проверка доступа
      const access = await workspaceRepository.checkAccess(
        workspace.id,
        ctx.session.user.id,
      );

      if (!access) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Нет доступа к workspace",
        });
      }

      return { workspace, role: access.role };
    }),

  // Получить участников workspace
  members: protectedProcedure
    .input(z.object({ workspaceId: z.string().regex(/^ws_[0-9a-f]{32}$/) }))
    .query(async ({ input, ctx }) => {
      // Проверка доступа
      const access = await workspaceRepository.checkAccess(
        input.workspaceId,
        ctx.session.user.id,
      );

      if (!access) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Нет доступа к workspace",
        });
      }

      const members = await workspaceRepository.getMembers(input.workspaceId);
      return members;
    }),
};
