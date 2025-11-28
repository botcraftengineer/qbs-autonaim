import { eq } from "@selectio/db";
import { vacancy } from "@selectio/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const getById = protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(({ ctx, input }) => {
    return ctx.db.query.vacancy.findFirst({
      where: eq(vacancy.id, input.id),
    });
  });
