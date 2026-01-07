import { env, paths } from "@qbs-autonaim/config";
import { and, eq } from "@qbs-autonaim/db";
import { gig, gigInterviewLink } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const getInterviewLink = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .query(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const foundGig = await ctx.db.query.gig.findFirst({
      where: and(
        eq(gig.id, input.gigId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!foundGig) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Гиг не найден",
      });
    }

    const link = await ctx.db.query.gigInterviewLink.findFirst({
      where: and(
        eq(gigInterviewLink.gigId, input.gigId),
        eq(gigInterviewLink.isActive, true),
      ),
    });

    if (!link) {
      return null;
    }

    const baseUrl = env.NEXT_PUBLIC_APP_URL;

    return {
      id: link.id,
      gigId: link.gigId,
      token: link.token,
      url: `${baseUrl}${paths.interview(link.token)}`,
      isActive: link.isActive,
      createdAt: link.createdAt,
    };
  });
