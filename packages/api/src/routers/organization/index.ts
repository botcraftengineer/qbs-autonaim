import type { TRPCRouterRecord } from "@trpc/server";

import { create } from "./create";
import { deleteOrganization } from "./delete";
import { get } from "./get";
import { acceptInvite } from "./invites/accept";
import { createInvite } from "./invites/create";
import { deleteInvite } from "./invites/delete";
import { listInvites } from "./invites/list";
import { list } from "./list";
import { addMember } from "./members/add";
import { listMembers } from "./members/list";
import { removeMember } from "./members/remove";
import { updateMemberRole } from "./members/update-role";
import { update } from "./update";

export const organizationRouter = {
  list,
  get,
  create,
  update,
  delete: deleteOrganization,
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
  createInvite,
  listInvites,
  acceptInvite,
  deleteInvite,
} satisfies TRPCRouterRecord;
