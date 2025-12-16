import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const listActivities = protectedProcedure
  .input(
    z.object({
      candidateId: uuidv7Schema,
      workspaceId: workspaceIdSchema,
    }),
  )
  .query(async ({ input }) => {
    // TODO: Implement when DB schema is ready
    // For now return mock data based on candidate
    return [
      {
        id: "1",
        type: "APPLIED",
        description: "Кандидат откликнулся на вакансию",
        createdAt: new Date(),
        author: null,
      },
    ];
  });
