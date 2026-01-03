/**
 * Analytics Router
 *
 * tRPC router для аналитики преквалификации.
 */

import type { TRPCRouterRecord } from "@trpc/server";

import { exportData } from "./export-data";
import { getDashboard } from "./get-dashboard";
import { getVacancyAnalytics } from "./get-vacancy-analytics";
import { trackEvent } from "./track-event";

export const analyticsRouter = {
  getDashboard,
  getVacancyAnalytics,
  exportData,
  trackEvent,
} satisfies TRPCRouterRecord;
