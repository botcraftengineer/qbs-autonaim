import { db } from "@qbs-autonaim/db/client";
import {
  CreateWorkspaceCustomDomainSchema,
  workspaceCustomDomain,
} from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { generateSlug } from "../../../utils/slug-generator";

export const create = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      domain: CreateWorkspaceCustomDomainSchema.shape.domain,
      type: z.enum(["interview", "prequalification"]).default("interview"),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const member = await db.query.workspaceMember.findFirst({
      where: (member, { eq, and }) =>
        and(
          eq(member.workspaceId, input.workspaceId),
          eq(member.userId, ctx.session.user.id),
        ),
    });

    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для добавления домена",
      });
    }

    const existing = await db.query.workspaceCustomDomain.findFirst({
      where: (domain, { eq, and }) =>
        and(
          eq(domain.domain, input.domain.toLowerCase()),
          eq(domain.type, input.type),
        ),
    });

    if (existing) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Домен уже используется для этого типа",
      });
    }

    const verificationToken = generateSlug();

    const [created] = await db
      .insert(workspaceCustomDomain)
      .values({
        workspaceId: input.workspaceId,
        domain: input.domain.toLowerCase(),
        type: input.type,
        verificationToken,
        isVerified: false,
        isPrimary: false,
      })
      .returning();

    if (!created) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать домен",
      });
    }

    return created;
  });
