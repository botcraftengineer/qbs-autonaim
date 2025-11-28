import { getDownloadUrl, getFileUrl } from "@selectio/lib";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const getFileUrlRouter = createTRPCRouter({
  getUrl: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      // Для MinIO используем прямой URL, для AWS S3 - presigned URL
      const url = process.env.AWS_S3_ENDPOINT
        ? getFileUrl(input.key)
        : await getDownloadUrl(input.key);
      return { url };
    }),
});
