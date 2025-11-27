import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    TELEGRAM_BOT_TOKEN: z.string().min(1),
    TELEGRAM_API_ID: z.string().min(1),
    TELEGRAM_API_HASH: z.string().min(1),
  },
  runtimeEnv: {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_API_ID: process.env.TELEGRAM_API_ID,
    TELEGRAM_API_HASH: process.env.TELEGRAM_API_HASH,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
