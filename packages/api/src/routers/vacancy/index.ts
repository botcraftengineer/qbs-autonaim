import type { TRPCRouterRecord } from "@trpc/server";

import { getAnalytics } from "./analytics";
import { getDashboardStats } from "./dashboard-stats";
import { getById } from "./get";
import { improveInstructions } from "./improve-instructions";
import { list } from "./list";
import { listActive } from "./list-active";
import { responsesRouter } from "./responses";
import { getResponsesChartData } from "./responses-chart";
import { updateSettings } from "./update";

export const vacancyRouter = {
  list,
  listActive,
  get: getById,
  analytics: getAnalytics,
  dashboardStats: getDashboardStats,
  responsesChart: getResponsesChartData,
  update: updateSettings,
  improveInstructions,
  responses: responsesRouter,
} satisfies TRPCRouterRecord;
