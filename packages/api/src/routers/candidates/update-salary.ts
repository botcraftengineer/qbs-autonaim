import { and, eq } from "@qbs-autonaim/db";
import type { response as responseTable } from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const updateSalaryExpectations = protectedProcedure
  .input(
    z.object({
      candidateId: uuidv7Schema,
      workspaceId: workspaceIdSchema,
      salaryExpectations: z.string().max(200).optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    const response = await ctx.db.query.response.findFirst({
      where: (
        response: typeof responseTable,
        { eq, and }: { eq: any; and: any },
      ) =>
        and(
          eq(response.id, input.candidateId),
          eq(response.entityType, "vacancy"),
        ),
      with: {
        vacancy: {
          columns: {
            workspaceId: true,
          },
        },
      },
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Кандидат не найден",
      });
    }

    if (response.vacancy.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому кандидату",
      });
    }

    await ctx.db
      .update(responseTable)
      .set({
        salaryExpectations: input.salaryExpectations,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(responseTable.id, input.candidateId),
          eq(responseTable.entityType, "vacancy"),
        ),
      );

    return { success: true };
  });
