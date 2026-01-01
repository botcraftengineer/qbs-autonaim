import type { TRPCRouterRecord } from "@trpc/server";

import { accept } from "./accept";
import { create } from "./create";
import { get } from "./get";
import { list } from "./list";
import { reject } from "./reject";
import { sendMessage } from "./send-message";
import { updateStatus } from "./update-status";

export const gigResponsesRouter = {
  list,
  get,
  create,
  updateStatus,
  accept,
  reject,
  sendMessage,
} satisfies TRPCRouterRecord;
