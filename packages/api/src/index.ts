import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "./root";

/**
 * Inference helpers for input types
 * @example
 * type PostByIdInput = RouterInputs['post']['byId']
 *      ^? { id: number }
 */
type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type AllPostsOutput = RouterOutputs['post']['all']
 *      ^? Post[]
 */
type RouterOutputs = inferRouterOutputs<AppRouter>;

export type {
  TenantErrorCode,
  TenantOperation,
  TenantResourceType,
  TenantVerificationParams,
  TenantVerificationResult,
} from "./middleware";
export {
  createTenantGuard,
  TenantGuard,
  TenantIsolationError,
  toTRPCError,
  withTenantGuard,
} from "./middleware";
export { type AppRouter, appRouter } from "./root";
export { AuditLoggerService } from "./services/audit-logger";
export { createTRPCContext } from "./trpc";
export {
  getInterviewBaseUrl,
  getInterviewUrl,
  getInterviewUrlFromDb,
} from "./utils/get-interview-url";
export type { RouterInputs, RouterOutputs };
