import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export const env = createEnv({
  server: {
    HH_EMAIL: z.string().email(),
    HH_PASSWORD: z.string().min(1),
    DEEPSEEK_API_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
