import {
  response as responseTable,
  user,
  vacancy,
  vacancyResponseComment,
} from "@qbs-autonaim/db";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const listComments = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      candidateId: uuidv7Schema,
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
        message: "Нет доступа к workspace",
      });
    }

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
        responseTable,
        eq(vacancyResponseComment.responseId, responseTable.id),
      )
      .innerJoin(vacancy, eq(responseTable.entityId, vacancy.id))
      .innerJoin(user, eq(vacancyResponseComment.authorId, user.id))
      .where(
        and(
          eq(responseTable.id, input.candidateId),
          eq(responseTable.entityType, "vacancy"),
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
