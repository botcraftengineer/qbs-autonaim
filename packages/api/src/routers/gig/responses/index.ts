import type { TRPCRouterRecord } from "@trpc/server";

import { accept } from "./accept";
import { create } from "./create";
import { generateInvitation } from "./generate-invitation";
import { get } from "./get";
import { getInvitation } from "./get-invitation";
import { list } from "./list";
import { reject } from "./reject";
import { sendMessage } from "./send-message";
import { update } from "./update";
import { updateStatus } from "./update-status";

export const gigResponsesRouter = {
  list,
  get,
  create,
  update,
  updateStatus,
  accept,
  reject,
  sendMessage,
  generateInvitation,
  getInvitation,
} satisfies TRPCRouterRecord;
