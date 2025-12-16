import type { TRPCRouterRecord } from "@trpc/server";

import { list } from "./list";

export const activitiesRouter = {
  list,
} satisfies TRPCRouterRecord;
