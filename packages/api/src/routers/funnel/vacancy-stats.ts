import { eq } from "@qbs-autonaim/db";
import { funnelCandidate } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const vacancyStats = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const candidates = await ctx.db.query.funnelCandidate.findMany({
      where: eq(funnelCandidate.workspaceId, input.workspaceId),
    });

    const statsByVacancy = new Map<
      string,
      {
        vacancyId: string;
        vacancyName: string;
        total: number;
        inProcess: number;
        hired: number;
        rejected: number;
      }
    >();

    for (const candidate of candidates) {
      const existing = statsByVacancy.get(candidate.vacancyId);

      if (existing) {
        existing.total++;
        if (candidate.stage === "HIRED") {
          existing.hired++;
        } else if (candidate.stage === "REJECTED") {
          existing.rejected++;
        } else {
          existing.inProcess++;
        }
      } else {
        statsByVacancy.set(candidate.vacancyId, {
          vacancyId: candidate.vacancyId,
          vacancyName: candidate.vacancyName,
          total: 1,
          inProcess:
            candidate.stage !== "HIRED" && candidate.stage !== "REJECTED"
              ? 1
              : 0,
          hired: candidate.stage === "HIRED" ? 1 : 0,
          rejected: candidate.stage === "REJECTED" ? 1 : 0,
        });
      }
    }

    return Array.from(statsByVacancy.values()).sort(
      (a, b) => b.total - a.total,
    );
  });
