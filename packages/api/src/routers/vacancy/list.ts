import { desc } from "@qbs-autonaim/db";
import { vacancy } from "@qbs-autonaim/db/schema";
import { protectedProcedure } from "../../trpc";

export const list = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
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
      where: eq(vacancy.workspaceId, input.workspaceId),
      orderBy: [desc(vacancy.createdAt)],
    });
  });
