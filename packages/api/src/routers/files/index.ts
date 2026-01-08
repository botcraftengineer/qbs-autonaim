import { createTRPCRouter } from "../../trpc";
import { getImageUrl } from "./get-image";
import { getInterviewMedia } from "./get-interview-media";

export const filesRouter = createTRPCRouter({
  getImageUrl,
  getInterviewMedia,
});
