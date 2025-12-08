import { and, desc, eq, workspaceRepository } from "@selectio/db";
import { vacancy } from "@selectio/db/schema";
import { workspaceIdSchema } from "@selectio/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const listActive = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      limit: z.number().min(1).max(100).default(5),
    }),
  )
  .query(async ({ ctx, input }) => {
    // Проверка доступа к workspace
    const access = await workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    return ctx.db.query.vacancy.findMany({
      where: and(
        eq(vacancy.workspaceId, input.workspaceId),
        eq(vacancy.isActive, true),
      ),
      orderBy: [desc(vacancy.createdAt)],
      limit: input.limit,
    });
  });
