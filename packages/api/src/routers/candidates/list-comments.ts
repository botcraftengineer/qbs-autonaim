import {
  user,
  vacancy,
  vacancyResponse,
  vacancyResponseComment,
} from "@qbs-autonaim/db";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const listComments = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      candidateId: z.string(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const comments = await ctx.db
      .select({
        id: vacancyResponseComment.id,
        responseId: vacancyResponseComment.responseId,
        content: vacancyResponseComment.content,
        isPrivate: vacancyResponseComment.isPrivate,
        createdAt: vacancyResponseComment.createdAt,
        authorId: user.id,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(vacancyResponseComment)
      .innerJoin(
        vacancyResponse,
        eq(vacancyResponseComment.responseId, vacancyResponse.id),
      )
      .innerJoin(vacancy, eq(vacancyResponse.vacancyId, vacancy.id))
      .innerJoin(user, eq(vacancyResponseComment.authorId, user.id))
      .where(
        and(
          eq(vacancyResponse.id, input.candidateId),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      )
      .orderBy(desc(vacancyResponseComment.createdAt));

    return comments.map((comment) => ({
      id: comment.id,
      candidateId: comment.responseId,
      content: comment.content,
      isPrivate: comment.isPrivate,
      createdAt: comment.createdAt,
      author: comment.authorName,
      authorAvatar: comment.authorImage,
    }));
  });
