import { workspaceRepository } from "@qbs-autonaim/db";
import { protectedProcedure } from "../../trpc";

export const list = protectedProcedure.query(async ({ ctx }) => {
  const workspaces = await workspaceRepository.findByUserId(
    ctx.session.user.id,
  );
  return workspaces;
});
