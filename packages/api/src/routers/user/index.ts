import type { TRPCRouterRecord } from "@trpc/server";

import { checkWorkspaceAccess } from "./check-workspace-access";
import { clearActiveWorkspace } from "./clear-active-workspace";
import { deleteAccount } from "./delete";
import { me } from "./me";
import { setActiveWorkspace } from "./set-active-workspace";
import { updateAccount } from "./update";

export const userRouter = {
  me,
  update: updateAccount,
  delete: deleteAccount,
  setActiveWorkspace,
  checkWorkspaceAccess,
  clearActiveWorkspace,
} satisfies TRPCRouterRecord;
