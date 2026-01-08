import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { workspaceCustomDomain } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const deleteDomain = protectedProcedure
  .input(
    z.object({
      domainId: z.string().uuid(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const domain = await db.query.workspaceCustomDomain.findFirst({
      where: eq(workspaceCustomDomain.id, input.domainId),
      with: {
        workspace: {
          with: {
            members: {
              where: (member, { eq }) => eq(member.userId, ctx.session.user.id),
            },
          },
        },
      },
    });

    if (!domain) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Домен не найден",
      });
    }

    const member = domain.workspace.members[0];
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для удаления домена",
      });
    }

    await db
      .delete(workspaceCustomDomain)
      .where(eq(workspaceCustomDomain.id, input.domainId));

    return { success: true };
  });
