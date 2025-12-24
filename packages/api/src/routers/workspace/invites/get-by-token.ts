import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const getByToken = protectedProcedure
  .input(z.object({ token: z.string() }))
  .query(async ({ input, ctx }) => {
    const invite = await ctx.workspaceRepository.getInviteByToken(input.token);

    if (!invite) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Приглашение не найдено",
      });
    }

    return invite;
  });
