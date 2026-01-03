/**
 * Custom Domain Router
 *
 * tRPC router для управления кастомными доменами виджета преквалификации.
 */

import type { TRPCRouterRecord } from "@trpc/server";

import { checkAvailability } from "./check-availability";
import { deleteDomain } from "./delete-domain";
import { getStatus } from "./get-status";
import { registerDomain } from "./register-domain";
import { verifyDomain } from "./verify-domain";

export const customDomainRouter = {
  registerDomain,
  verifyDomain,
  getStatus,
  deleteDomain,
  checkAvailability,
} satisfies TRPCRouterRecord;
