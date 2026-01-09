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

export {
  getInterviewBaseUrl,
  getInterviewUrl,
  getInterviewUrlFromDb,
} from "@qbs-autonaim/shared";
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
export { RankingService } from "./services/gig/ranking/ranking-service";
export { createTRPCContext } from "./trpc";
export type { RouterInputs, RouterOutputs };
