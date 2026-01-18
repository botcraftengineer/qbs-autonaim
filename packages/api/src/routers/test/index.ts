import type { TRPCRouterRecord } from "@trpc/server";

import { cleanupTestUser, setupTestUser } from "./setup";

export const testRouter = {
  setup: setupTestUser,
  cleanup: cleanupTestUser,
} satisfies TRPCRouterRecord;
