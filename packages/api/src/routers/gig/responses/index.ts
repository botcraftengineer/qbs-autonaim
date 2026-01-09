import type { TRPCRouterRecord } from "@trpc/server";

import { accept } from "./accept";
import { countResponses } from "./count";
import { create } from "./create";
import { generateInvitation } from "./generate-invitation";
import { get } from "./get";
import { getInvitation } from "./get-invitation";
import { list } from "./list";
import { ranked } from "./ranked";
import { recalculateRanking } from "./recalculate-ranking";
import { reject } from "./reject";
import { sendMessage } from "./send-message";
import { update } from "./update";
import { updateStatus } from "./update-status";

export const gigResponsesRouter = {
  list,
  get,
  count: countResponses,
  create,
  update,
  updateStatus,
  accept,
  reject,
  sendMessage,
  generateInvitation,
  getInvitation,
  ranked,
  recalculateRanking,
} satisfies TRPCRouterRecord;
