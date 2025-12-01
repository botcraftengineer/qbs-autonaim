import { eq } from "@selectio/db";
import { user } from "@selectio/db/schema";
import { protectedProcedure } from "../../trpc";

export const deleteAccount = protectedProcedure.mutation(async ({ ctx }) => {
  // Удаляем пользователя (каскадное удаление должно быть настроено в БД)
  await ctx.db.delete(user).where(eq(user.id, ctx.session.user.id));

  return { success: true };
});
