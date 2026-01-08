import { and, eq } from "@qbs-autonaim/db";
import { gig, gigInterviewLink, workspace } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { getInterviewUrl } from "../../utils/get-interview-url";

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

    const workspaceData = await ctx.db.query.workspace.findFirst({
      where: eq(workspace.id, input.workspaceId),
      columns: {
        interviewDomain: true,
      },
    });

    return {
      id: link.id,
      gigId: link.gigId,
      token: link.token,
      url: getInterviewUrl(link.token, workspaceData?.interviewDomain),
      isActive: link.isActive,
      createdAt: link.createdAt,
    };
  });
