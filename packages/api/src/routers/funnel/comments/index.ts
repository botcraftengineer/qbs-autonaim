import type { TRPCRouterRecord } from "@trpc/server";

import { add } from "./add";
import { deleteComment } from "./delete";
import { list } from "./list";

export const commentsRouter = {
  list,
  add,
  delete: deleteComment,
} satisfies TRPCRouterRecord;
