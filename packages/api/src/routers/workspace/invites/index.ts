import type { TRPCRouterRecord } from "@trpc/server";

import { accept } from "./accept";
import { cancel } from "./cancel";
import { createLink } from "./create-link";
import { getByToken } from "./get-by-token";
import { getLink } from "./get-link";
import { listInvites } from "./list";
import { getPending } from "./pending";
import { resend } from "./resend";

export const invitesRouter = {
  list: listInvites,
  createLink,
  getLink,
  getByToken,
  pending: getPending,
  accept,
  resend,
  cancel,
} satisfies TRPCRouterRecord;
