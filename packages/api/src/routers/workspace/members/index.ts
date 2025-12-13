import type { TRPCRouterRecord } from "@trpc/server";

import { addMember } from "./add";
import { listMembers } from "./list";
import { removeMember } from "./remove";
import { updateRole } from "./update-role";

export const membersRouter = {
  list: listMembers,
  add: addMember,
  remove: removeMember,
  updateRole,
} satisfies TRPCRouterRecord;
