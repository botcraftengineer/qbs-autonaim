import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

type Prettify<T> = { [K in keyof T]: T[K] } & {};

export const env: Prettify<{
  NODE_ENV?: "development" | "production" | "test";
  VERCEL_ENV?: "development" | "preview" | "production";
  VERCEL_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  POSTGRES_URL?: string;
  RESEND_API_KEY?: string;
  EMAIL_SANDBOX_ENABLED: boolean;
  EMAIL_SANDBOX_HOST: string;
  EMAIL_FROM: string;
  AUTH_SECRET?: string;
  AUTH_GOOGLE_ID?: string;
  AUTH_GOOGLE_SECRET?: string;
  AWS_S3_ENDPOINT?: string;
  AWS_S3_FORCE_PATH_STYLE?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION: string;
  AWS_S3_BUCKET: string;
  AI_PROVIDER: "openai" | "deepseek";
  AI_MODEL?: string;
  OPENAI_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  LANGFUSE_SECRET_KEY?: string;
  LANGFUSE_PUBLIC_KEY?: string;
  LANGFUSE_BASE_URL?: string;
  PORT: number;
  USER_ID?: string;
  TELEGRAM_API_ID?: string;
  TELEGRAM_API_HASH?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_BOT_USERNAME?: string;
  TG_CLIENT_URL: string;
  INNGEST_EVENT_KEY?: string;
  INNGEST_SIGNING_KEY?: string;
  INNGEST_EVENT_API_BASE_URL: string;
  APP_URL: string;
  APP_NAME: string;
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_APP_NAME: string;
  INTERVIEW_BUFFER_DEBOUNCE_TIMEOUT: number;
  INTERVIEW_TYPING_DEBOUNCE_TIMEOUT: number;
  INTERVIEW_BUFFER_ENABLED: boolean;
}> = createEnv({
  server: {
    // Node environment
    NODE_ENV: z.enum(["development", "production", "test"]).optional(),

    // Vercel
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
    VERCEL_URL: z.string().optional(),
    VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),

    // Database
    POSTGRES_URL: z.url().optional(),

    // Email
    RESEND_API_KEY: z.string().optional(),
    EMAIL_SANDBOX_ENABLED: z.coerce.boolean().optional().default(false),
    EMAIL_SANDBOX_HOST: z.string().default("localhost"),
    EMAIL_FROM: z.string().default("QBS Автонайм <onboarding@resend.dev>"),

    // Auth
    AUTH_SECRET: z.string().optional(),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),

    // AWS S3
    AWS_S3_ENDPOINT: z.string().optional(),
    AWS_S3_FORCE_PATH_STYLE: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().default("us-east-1"),
    AWS_S3_BUCKET: z.string().default("acme-bucket"),

    // AI Services
    AI_PROVIDER: z.enum(["openai", "deepseek"]).default("openai"),
    AI_MODEL: z.string().optional(),
    OPENAI_API_KEY: z.string().min(1).optional(),
    DEEPSEEK_API_KEY: z.string().min(1).optional(),
    LANGFUSE_SECRET_KEY: z.string().min(1).optional(),
    LANGFUSE_PUBLIC_KEY: z.string().min(1).optional(),
    LANGFUSE_BASE_URL: z.url().optional(),

    // Jobs
    PORT: z.string().optional().default("8000").transform(Number),
    USER_ID: z.string().optional(),

    // Telegram
    TELEGRAM_API_ID: z.string().min(1).optional(),
    TELEGRAM_API_HASH: z.string().min(1).optional(),
    TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
    TELEGRAM_BOT_USERNAME: z.string().min(1).optional(),
    TG_CLIENT_URL: z.url().optional().default("http://localhost:8001"),

    // Inngest
    INNGEST_EVENT_KEY: z.string().min(1).optional(),
    INNGEST_SIGNING_KEY: z.string().min(1).optional(),
    INNGEST_EVENT_API_BASE_URL: z.url().optional().default("https://inn.gs"),

    // App URL
    APP_URL: z.url().optional().default("https://qbs-autonaim.vercel.app"),
    APP_NAME: z.string().optional().default("QBS Автонайм"),

    // Interview Buffer Configuration
    INTERVIEW_BUFFER_DEBOUNCE_TIMEOUT: z
      .string()
      .optional()
      .default("10")
      .transform(Number),
    INTERVIEW_TYPING_DEBOUNCE_TIMEOUT: z
      .string()
      .optional()
      .default("5")
      .transform(Number),
    INTERVIEW_BUFFER_ENABLED: z
      .string()
      .optional()
      .default("true")
      .transform((val) => val === "true"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z
      .url()
      .optional()
      .default("https://qbs-autonaim.vercel.app"),
    NEXT_PUBLIC_APP_NAME: z.string().optional().default("QBS Автонайм"),
  },
  clientPrefix: "NEXT_PUBLIC_",
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_SANDBOX_ENABLED: process.env.EMAIL_SANDBOX_ENABLED === "true",
    EMAIL_SANDBOX_HOST: process.env.EMAIL_SANDBOX_HOST,
    EMAIL_FROM: process.env.EMAIL_FROM,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT,
    AWS_S3_FORCE_PATH_STYLE: process.env.AWS_S3_FORCE_PATH_STYLE,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY,
    LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY,
    LANGFUSE_BASE_URL: process.env.LANGFUSE_BASE_URL,
    PORT: process.env.PORT,
    USER_ID: process.env.USER_ID,
    TELEGRAM_API_ID: process.env.TELEGRAM_API_ID,
    TELEGRAM_API_HASH: process.env.TELEGRAM_API_HASH,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME,
    TG_CLIENT_URL: process.env.TG_CLIENT_URL,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    INNGEST_EVENT_API_BASE_URL: process.env.INNGEST_EVENT_API_BASE_URL,
    APP_URL: process.env.APP_URL,
    APP_NAME: process.env.APP_NAME,
    INTERVIEW_BUFFER_DEBOUNCE_TIMEOUT:
      process.env.INTERVIEW_BUFFER_DEBOUNCE_TIMEOUT,
    INTERVIEW_TYPING_DEBOUNCE_TIMEOUT:
      process.env.INTERVIEW_TYPING_DEBOUNCE_TIMEOUT,
    INTERVIEW_BUFFER_ENABLED: process.env.INTERVIEW_BUFFER_ENABLED,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
