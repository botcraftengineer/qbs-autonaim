import type { TRPCRouterRecord } from "@trpc/server";

import { analytics } from "./analytics";
import { chatGenerate } from "./chat-generate";
import { dashboardStats } from "./dashboard-stats";
import { get } from "./get";
import { improveInstructions } from "./improve-instructions";
import { list } from "./list";
import { listActive } from "./list-active";
import { responsesRouter } from "./responses";
import { responsesChart } from "./responses-chart";
import { update } from "./update";

export const vacancyRouter = {
  list,
  listActive,
  get,
  analytics,
  dashboardStats,
  responsesChart,
  update,
  improveInstructions,
  chatGenerate,
  responses: responsesRouter,
} satisfies TRPCRouterRecord;
