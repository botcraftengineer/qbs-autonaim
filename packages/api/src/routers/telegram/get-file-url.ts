import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const getFileUrlRouter = {
  getUrl: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const url = await getDownloadUrl(input.key);
      return { url };
    }),
} satisfies TRPCRouterRecord;
