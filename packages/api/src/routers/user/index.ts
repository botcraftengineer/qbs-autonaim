import type { TRPCRouterRecord } from "@trpc/server";

import { deleteAccount } from "./delete";
import { me } from "./me";
import { updateAccount } from "./update";

export const userRouter = {
  me,
  update: updateAccount,
  delete: deleteAccount,
} satisfies TRPCRouterRecord;
