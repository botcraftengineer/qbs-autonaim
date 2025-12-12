import type { TRPCRouterRecord } from "@trpc/server";
import { getAnalytics } from "./get-analytics";
import { getById } from "./get-by-id";
import { getDashboardStats } from "./get-dashboard-stats";
import { getResponsesChartData } from "./get-responses-chart-data";
import { list } from "./list";
import { listActive } from "./list-active";
import { responsesRouter } from "./responses";
import { updateSettings } from "./update-settings";

export const vacancyRouter = {
  list,
  listActive,
  getById,
  getAnalytics,
  getDashboardStats,
  getResponsesChartData,
  updateSettings,
  responses: responsesRouter,
} satisfies TRPCRouterRecord;
