import { eq, user } from "@selectio/db";
import { profileFormSchema } from "@selectio/validators";

import { protectedProcedure } from "../../trpc";

export const updateProfile = protectedProcedure
  .input(profileFormSchema)
  .mutation(async ({ ctx, input }) => {
    await ctx.db
      .update(user)
      .set({
        username: input.username,
        email: input.email,
        bio: input.bio,
        updatedAt: new Date(),
      })
      .where(eq(user.id, ctx.session.user.id));

    return { success: true };
  });
