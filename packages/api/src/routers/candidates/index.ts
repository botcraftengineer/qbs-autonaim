import { createTRPCRouter } from "../../trpc";
import { listActivities } from "./activities";
import { list } from "./list";
import { listMessages, sendMessage } from "./messages";
import { updateStage } from "./update-stage";

export const candidatesRouter = createTRPCRouter({
  list,
  updateStage,
  listActivities,
  listMessages,
  sendMessage,
});
