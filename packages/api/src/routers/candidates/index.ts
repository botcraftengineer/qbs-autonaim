import { createTRPCRouter } from "../../trpc";
import { list } from "./list";
import { updateStage } from "./update-stage";

export const candidatesRouter = createTRPCRouter({
  list,
  updateStage,
});
