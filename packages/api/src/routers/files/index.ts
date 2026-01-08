import { createTRPCRouter } from "../../trpc";
import { getImageUrl } from "./get-image";
import { getInterviewMedia } from "./get-interview-media";
import { uploadInterviewMedia } from "./upload-interview-media";

export const filesRouter = createTRPCRouter({
  getImageUrl,
  getInterviewMedia,
  uploadInterviewMedia,
});
