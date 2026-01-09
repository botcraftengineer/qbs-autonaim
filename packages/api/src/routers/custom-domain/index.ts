import type { TRPCRouterRecord } from "@trpc/server";

import { checkAvailability } from "./check-availability";
import { create } from "./create";
import { deleteDomain } from "./delete";
import { list } from "./list";
import { setPrimary } from "./set-primary";
import { verify } from "./verify";

export const customDomainRouter = {
  list,
  create,
  verify,
  setPrimary,
  checkAvailability,
  delete: deleteDomain,
} satisfies TRPCRouterRecord;
