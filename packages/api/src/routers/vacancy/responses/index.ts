import type { TRPCRouterRecord } from "@trpc/server";

import { getById } from "./get-by-id";
import { list } from "./list";
import { listAll } from "./list-all";
import { sendByUsername } from "./send-by-username";
import { sendWelcome } from "./send-welcome";

export const responsesRouter = {
  list,
  listAll,
  getById,
  sendWelcome,
  sendByUsername,
} satisfies TRPCRouterRecord;
