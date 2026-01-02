import type { TRPCRouterRecord } from "@trpc/server";

import { get } from "./get";
import { update } from "./update";
import { updateOnboarding } from "./update-onboarding";

export const companyRouter = {
  get,
  update,
  updateOnboarding,
} satisfies TRPCRouterRecord;
