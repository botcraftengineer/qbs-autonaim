import type { TRPCRouterRecord } from "@trpc/server";

import { create } from "./create";
import { deleteOrganization } from "./delete";
import { get } from "./get";
import { list } from "./list";
import { update } from "./update";

export const organizationRouter = {
  list,
  get,
  create,
  update,
  delete: deleteOrganization,
} satisfies TRPCRouterRecord;
