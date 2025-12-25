import type { TRPCRouterRecord } from "@trpc/server";

import { deleteAccount } from "./delete";
import { me } from "./me";
import { setActiveWorkspace } from "./set-active-workspace";
import { updateAccount } from "./update";

export const userRouter = {
  me,
  update: updateAccount,
  delete: deleteAccount,
  setActiveWorkspace,
} satisfies TRPCRouterRecord;
