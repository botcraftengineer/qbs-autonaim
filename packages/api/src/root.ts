import { candidatesRouter } from "./routers/candidates";
import { companyRouter } from "./routers/company";
import { filesRouter } from "./routers/files";
import { freelancePlatformsRouter } from "./routers/freelance-platforms";
import { funnelRouter } from "./routers/funnel";
import { integrationRouter } from "./routers/integration";
import { organizationRouter } from "./routers/organization";
import { telegramRouter } from "./routers/telegram";
import { testRouter } from "./routers/test";
import { userRouter } from "./routers/user";
import { vacancyRouter } from "./routers/vacancy";
import { workspaceRouter } from "./routers/workspace";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  user: userRouter,
  vacancy: vacancyRouter,
  integration: integrationRouter,
  company: companyRouter,
  telegram: telegramRouter,
  workspace: workspaceRouter,
  organization: organizationRouter,
  funnel: funnelRouter,
  candidates: candidatesRouter,
  files: filesRouter,
  freelancePlatforms: freelancePlatformsRouter,
  ...(process.env.NODE_ENV !== "production" && { test: testRouter }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
