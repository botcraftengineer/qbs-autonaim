import type { TRPCRouterRecord } from "@trpc/server";

import { create } from "./create";
import { customDomainRouter } from "./custom-domain";
import { deleteWorkspace } from "./delete";
import { get } from "./get";
import { getBySlug } from "./get-by-slug";
import { invitesRouter } from "./invites";
import { list } from "./list";
import { membersRouter } from "./members";
import { update } from "./update";

export const workspaceRouter = {
  list,
  get,
  getBySlug,
  create,
  update,
  delete: deleteWorkspace,
  members: membersRouter,
  invites: invitesRouter,
  customDomain: customDomainRouter,
} satisfies TRPCRouterRecord;
