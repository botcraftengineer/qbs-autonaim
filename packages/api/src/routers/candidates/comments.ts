import {
  user,
  vacancyResponse,
  vacancyResponseComment,
} from "@qbs-autonaim/db";
import { desc, eq } from "drizzle-orm";
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
      .innerJoin(user, eq(vacancyResponseComment.authorId, user.id))
      .where(eq(vacancyResponse.id, input.candidateId))
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

export const addComment = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      candidateId: z.string(),
      content: z.string().min(1),
      isPrivate: z.boolean().default(true),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const candidate = await ctx.db
      .select()
      .from(vacancyResponse)
      .where(eq(vacancyResponse.id, input.candidateId))
      .limit(1);

    if (!candidate.length) {
      throw new Error("Candidate not found");
    }

    const [comment] = await ctx.db
      .insert(vacancyResponseComment)
      .values({
        responseId: input.candidateId,
        authorId: ctx.session.user.id,
        content: input.content,
        isPrivate: input.isPrivate,
      })
      .returning();

    if (!comment) {
      throw new Error("Failed to create comment");
    }

    const [author] = await ctx.db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, ctx.session.user.id))
      .limit(1);

    return {
      id: comment.id,
      candidateId: comment.responseId,
      content: comment.content,
      isPrivate: comment.isPrivate,
      createdAt: comment.createdAt,
      author: author?.name ?? "Unknown",
      authorAvatar: author?.image,
    };
  });
