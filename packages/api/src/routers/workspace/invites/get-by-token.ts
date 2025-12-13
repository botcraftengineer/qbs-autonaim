import { workspaceRepository } from "@qbs-autonaim/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const getByToken = protectedProcedure
  .input(z.object({ token: z.string() }))
  .query(async ({ input }) => {
    const invite = await workspaceRepository.getInviteByToken(input.token);

    if (!invite) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Приглашение не найдено",
      });
    }

    return invite;
  });
