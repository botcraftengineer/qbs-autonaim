import { createTRPCRouter } from "../../trpc";
import { generateRequirements } from "./generate-requirements";
import { getAnalytics } from "./get-analytics";
import { getById } from "./get-by-id";
import { list } from "./list";
import { responsesRouter } from "./responses";

export const vacancyRouter = createTRPCRouter({
  list,
  getById,
  getAnalytics,
  generateRequirements,
  responses: createTRPCRouter(responsesRouter),
});
