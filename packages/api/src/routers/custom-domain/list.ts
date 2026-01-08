import { db } from "@qbs-autonaim/db/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const list = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      type: z.enum(["interview", "prequalification"]).optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const member = await db.query.workspaceMember.findFirst({
      where: (member, { eq, and }) =>
        and(
          eq(member.workspaceId, input.workspaceId),
          eq(member.userId, ctx.session.user.id),
        ),
    });

    if (!member) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    return await db.query.customDomain.findMany({
      where: (domain, { eq, and }) => {
        if (input.type) {
          return and(
            eq(domain.workspaceId, input.workspaceId),
            eq(domain.type, input.type),
          );
        }
        return eq(domain.workspaceId, input.workspaceId);
      },
      orderBy: (domain, { desc }) => [
        desc(domain.isPrimary),
        desc(domain.createdAt),
      ],
    });
  });
