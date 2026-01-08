import type { TRPCRouterRecord } from "@trpc/server";

import { chatGenerate } from "./chat-generate";
import { create } from "./create";
import { deleteGig } from "./delete";
import { generateInterviewLink } from "./generate-interview-link";
import { generateInvitationTemplate } from "./generate-invitation-template";
import { get } from "./get";
import { getInterviewLink } from "./get-interview-link";
import { list } from "./list";
import { listActive } from "./list-active";
import { gigResponsesRouter } from "./responses";
import { syncAllResponseCounts } from "./sync-all-response-counts";
import { syncResponseCounts } from "./sync-response-counts";
import { update } from "./update";

export const gigRouter = {
  list,
  listActive,
  get,
  create,
  update,
  delete: deleteGig,
  chatGenerate,
  generateInterviewLink,
  getInterviewLink,
  generateInvitationTemplate,
  syncResponseCounts,
  syncAllResponseCounts,
  responses: gigResponsesRouter,
} satisfies TRPCRouterRecord;
