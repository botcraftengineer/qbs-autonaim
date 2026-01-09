import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { customDomain } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const setPrimary = protectedProcedure
  .input(
    z.object({
      domainId: z.string().uuid(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const domain = await db.query.customDomain.findFirst({
      where: eq(customDomain.id, input.domainId),
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
        message: "Недостаточно прав для изменения основного домена",
      });
    }

    if (!domain.isVerified) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Домен должен быть верифицирован",
      });
    }

    await db.transaction(async (tx) => {
      await tx
        .update(customDomain)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(
          and(
            eq(customDomain.workspaceId, domain.workspaceId),
            eq(customDomain.type, domain.type),
          ),
        );

      await tx
        .update(customDomain)
        .set({ isPrimary: true, updatedAt: new Date() })
        .where(eq(customDomain.id, input.domainId));
    });

    return await db.query.customDomain.findFirst({
      where: eq(customDomain.id, input.domainId),
    });
  });
