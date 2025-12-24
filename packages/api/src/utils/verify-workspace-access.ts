import type { WorkspaceRepository } from "@qbs-autonaim/db";
import { TRPCError } from "@trpc/server";

export async function verifyWorkspaceAccess(
  workspaceRepository: WorkspaceRepository,
  workspaceId: string,
  userId: string,
) {
  const access = await workspaceRepository.checkAccess(workspaceId, userId);

  if (!access) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Нет доступа к этому workspace",
    });
  }

  return access;
}
