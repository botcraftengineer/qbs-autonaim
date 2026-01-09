import { env } from "./env";

export const APP_CONFIG = {
  name: env.NEXT_PUBLIC_APP_NAME,
  url: env.NEXT_PUBLIC_APP_URL,
  customDomainTarget: env.CUSTOM_DOMAIN_TARGET,
} as const;
