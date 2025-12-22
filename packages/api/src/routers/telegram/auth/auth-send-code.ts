import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { normalizePhone } from "../utils";

export const sendCodeRouter = protectedProcedure
  .input(
    z.object({
      apiId: z.number(),
      apiHash: z.string(),
      phone: z.string().trim(),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const phone = normalizePhone(input.phone);
      const result = await tgClientSDK.sendCode({
        apiId: input.apiId,
        apiHash: input.apiHash,
        phone,
      });

      return {
        phoneCodeHash: result.phoneCodeHash,
        timeout: result.timeout,
        sessionData: result.sessionData,
      };
    } catch (error) {
      console.error("Ошибка отправки кода:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error ? error.message : "Ошибка отправки кода",
      });
    }
  });
