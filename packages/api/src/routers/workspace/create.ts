import { organizationRepository, workspaceRepository } from "@qbs-autonaim/db";
import { optimizeLogo } from "@qbs-autonaim/lib/image";
import { createWorkspaceSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";

export const create = protectedProcedure
  .input(createWorkspaceSchema)
  .mutation(async ({ input, ctx }) => {
    // Получаем первую организацию пользователя
    const organizations = await organizationRepository.getUserOrganizations(
      ctx.session.user.id,
    );

    if (!organizations.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "У пользователя нет организаций",
      });
    }

    const organizationId = organizations[0]!.id;

    const existing = await workspaceRepository.findBySlug(input.slug);
    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Workspace с таким slug уже существует",
      });
    }

    const dataToCreate = { ...input };
    if (dataToCreate.logo?.startsWith("data:image/")) {
      dataToCreate.logo = await optimizeLogo(dataToCreate.logo);
    }

    const workspace = await workspaceRepository.create({
      ...dataToCreate,
      organizationId,
    });

    if (!workspace) {
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
