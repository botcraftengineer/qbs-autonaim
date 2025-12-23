import { organizationRepository } from "@qbs-autonaim/db";
import { optimizeLogo } from "@qbs-autonaim/lib/image";
import { createOrganizationSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";

export const create = protectedProcedure
  .input(createOrganizationSchema)
  .mutation(async ({ input, ctx }) => {
    const existing = await organizationRepository.findBySlug(input.slug);
    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Организация с таким slug уже существует",
      });
    }

    const dataToCreate = { ...input };
    if (dataToCreate.logo?.startsWith("data:image/")) {
      dataToCreate.logo = await optimizeLogo(dataToCreate.logo);
    }

    const organization = await organizationRepository.create(dataToCreate);

    if (!organization) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать организацию",
      });
    }

    await organizationRepository.addMember(
      organization.id,
      ctx.session.user.id,
      "owner",
    );

    return organization;
  });
