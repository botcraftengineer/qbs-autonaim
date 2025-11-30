import { desc, eq } from "@selectio/db";
import { vacancy } from "@selectio/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const listActive = protectedProcedure
  .input(
    z
      .object({
        limit: z.number().min(1).max(100).default(5),
      })
      .optional(),
  )
  .query(({ ctx, input }) => {
    const limit = input?.limit ?? 5;

    return ctx.db.query.vacancy.findMany({
      where: eq(vacancy.isActive, true),
      orderBy: [desc(vacancy.createdAt)],
      limit,
    });
  });
