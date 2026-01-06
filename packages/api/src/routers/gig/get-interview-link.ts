import { and, eq } from "@qbs-autonaim/db";
import { gig, gigInterviewLink } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const getInterviewLink = protectedProcedure
  .input(
    z.object({
      gigId: z.string().uuid(),
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qbs.app";

    return {
      id: link.id,
      gigId: link.gigId,
      slug: link.slug,
      url: `${baseUrl}/gig-interview/${link.slug}`,
      isActive: link.isActive,
      createdAt: link.createdAt,
    };
  });
