import { desc, workspaceRepository } from "@qbs-autonaim/db";
import { vacancyResponse } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const listTop = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      limit: z.number().int().min(1).max(20).default(5),
    }),
  )
  .query(async ({ ctx, input }) => {
    // Проверка доступа к workspace
    const access = await workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const allResponses = await ctx.db.query.vacancyResponse.findMany({
      orderBy: [desc(vacancyResponse.createdAt)],
      with: {
        vacancy: {
          columns: {
            id: true,
            title: true,
            workspaceId: true,
          },
        },
        screening: {
          columns: {
            score: true,
            detailedScore: true,
          },
        },
      },
      columns: {
        id: true,
        candidateName: true,
        createdAt: true,
      },
    });

    return allResponses
      .filter(
        (r) =>
          r.vacancy.workspaceId === input.workspaceId &&
          r.screening?.detailedScore != null,
      )
      .sort(
        (a, b) =>
          (b.screening?.detailedScore ?? 0) - (a.screening?.detailedScore ?? 0),
      )
      .slice(0, input.limit);
  });
