import { env } from "./env";

export const APP_CONFIG = {
  name: env.APP_NAME,
  url: env.NEXT_PUBLIC_APP_URL,
} as const;
