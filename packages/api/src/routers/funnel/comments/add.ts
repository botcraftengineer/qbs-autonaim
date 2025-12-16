import { funnelActivity, funnelComment } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const add = protectedProcedure
  .input(
    z.object({
      candidateId: z.string(),
      content: z.string().min(1),
      isPrivate: z.boolean().default(false),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const [comment] = await ctx.db
      .insert(funnelComment)
      .values({
        candidateId: input.candidateId,
        author: ctx.session.user.name ?? "Пользователь",
        content: input.content,
        isPrivate: input.isPrivate,
      })
      .returning();

    if (!comment) {
      throw new Error("Не удалось создать комментарий");
    }

    await ctx.db.insert(funnelActivity).values({
      candidateId: input.candidateId,
      type: "COMMENT",
      description: input.isPrivate
        ? "Добавлен приватный комментарий"
        : "Добавлен комментарий",
      author: ctx.session.user.name ?? "Пользователь",
    });

    return comment;
  });
