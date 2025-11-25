import { desc, eq } from "@selectio/db";
import { z } from "zod/v4";

import { protectedProcedure } from "../../../trpc";
import { vacancyResponse } from "@selectio/db/schema";

export const list = protectedProcedure
  .input(z.object({ vacancyId: z.string() }))
  .query(({ ctx, input }) => {
    return ctx.db.query.vacancyResponse.findMany({
      where: eq(vacancyResponse.vacancyId, input.vacancyId),
      orderBy: [desc(vacancyResponse.createdAt)],
    });
  });
