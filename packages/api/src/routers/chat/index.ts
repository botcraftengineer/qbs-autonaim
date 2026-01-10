import type { TRPCRouterRecord } from "@trpc/server";
import { clearHistory } from "./clear-history";
import { getHistory } from "./get-history";
import { sendMessage } from "./send-message";

export const chatRouter = {
  sendMessage,
  getHistory,
  clearHistory,
} satisfies TRPCRouterRecord;
