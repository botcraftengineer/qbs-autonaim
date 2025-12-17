import { createTRPCRouter } from "../../trpc";
import { getImageUrl } from "./get-image";

export const filesRouter = createTRPCRouter({
  getImageUrl,
});
