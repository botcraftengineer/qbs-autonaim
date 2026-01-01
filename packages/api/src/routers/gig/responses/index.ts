import type { TRPCRouterRecord } from "@trpc/server";

import { create } from "./create";
import { get } from "./get";
import { list } from "./list";
import { updateStatus } from "./update-status";

export const gigResponsesRouter = {
  list,
  get,
  create,
  updateStatus,
} satisfies TRPCRouterRecord;
