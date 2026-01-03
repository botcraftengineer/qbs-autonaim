import { analyticsRouter } from "./routers/analytics";
import { candidatesRouter } from "./routers/candidates";
import { companyRouter } from "./routers/company";
import { filesRouter } from "./routers/files";
import { freelancePlatformsRouter } from "./routers/freelance-platforms";
import { funnelRouter } from "./routers/funnel";
import { gigRouter } from "./routers/gig";
import { integrationRouter } from "./routers/integration";
import { organizationRouter } from "./routers/organization";
import { prequalificationRouter } from "./routers/prequalification";
import { telegramRouter } from "./routers/telegram";
import { testRouter } from "./routers/test";
import { userRouter } from "./routers/user";
import { vacancyRouter } from "./routers/vacancy";
import { widgetConfigRouter } from "./routers/widget-config";
import { workspaceRouter } from "./routers/workspace";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  user: userRouter,
  vacancy: vacancyRouter,
  gig: gigRouter,
  integration: integrationRouter,
  company: companyRouter,
  telegram: telegramRouter,
  workspace: workspaceRouter,
  organization: organizationRouter,
  funnel: funnelRouter,
  candidates: candidatesRouter,
  files: filesRouter,
  freelancePlatforms: freelancePlatformsRouter,
  prequalification: prequalificationRouter,
  widgetConfig: widgetConfigRouter,
  analytics: analyticsRouter,
  ...(process.env.NODE_ENV !== "production" && { test: testRouter }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
