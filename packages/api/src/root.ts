import { candidatesRouter } from "./routers/candidates";
import { companyRouter } from "./routers/company";
import { funnelRouter } from "./routers/funnel";
import { integrationRouter } from "./routers/integration";
import { telegramRouter } from "./routers/telegram";
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
  funnel: funnelRouter,
  candidates: candidatesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
