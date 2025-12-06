import { checkHHCredentials } from "@selectio/jobs/auth";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const verifyIntegrationCredentials = protectedProcedure
  .input(
    z.object({
      type: z.literal("hh"),
      email: z.email(),
      password: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    const { email, password } = input;

    // Performing verification using the shared logic (the same logic Inngest would use)
    const result = await checkHHCredentials(email, password);

    if (!result.success) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: result.error,
      });
    }

    const value = result.data;

    if (!value.isValid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: value.error || "Неверные данные для входа",
      });
    }

    return {
      success: true,
      isValid: true,
    };
  });
