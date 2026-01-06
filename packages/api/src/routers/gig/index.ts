import type { TRPCRouterRecord } from "@trpc/server";

import { chatGenerate } from "./chat-generate";
import { create } from "./create";
import { deleteGig } from "./delete";
import { generateInterviewLink } from "./generate-interview-link";
import { get } from "./get";
import { getInterviewLink } from "./get-interview-link";
import { list } from "./list";
import { listActive } from "./list-active";
import { gigResponsesRouter } from "./responses";
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
  responses: gigResponsesRouter,
} satisfies TRPCRouterRecord;
