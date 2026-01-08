import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { workspaceCustomDomain } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

async function checkDNSRecords(): Promise<boolean> {
  // TODO: Реализовать реальную проверку DNS
  return true;
}

export const verify = protectedProcedure
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
        message: "Недостаточно прав для верификации домена",
      });
    }

    if (domain.isVerified) {
      return domain;
    }

    const isValid = await checkDNSRecords();

    if (!isValid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "DNS записи не настроены корректно",
      });
    }

    const [updated] = await db
      .update(workspaceCustomDomain)
      .set({
        isVerified: true,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workspaceCustomDomain.id, input.domainId))
      .returning();

    return updated;
  });
