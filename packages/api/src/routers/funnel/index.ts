import type { TRPCRouterRecord } from "@trpc/server";
import { activitiesRouter } from "./activities";
import { analytics } from "./analytics";
import { commentsRouter } from "./comments";
import { list } from "./list";
import { updateStage } from "./update-stage";
import { vacancyStats } from "./vacancy-stats";

export const funnelRouter = {
  list,
  analytics,
  updateStage,
  vacancyStats,
  comments: commentsRouter,
  activities: activitiesRouter,
} satisfies TRPCRouterRecord;
