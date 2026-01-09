import { z } from "zod";

/**
 * Gig-related event schemas
 */

export const gigRankingRecalculateDataSchema = z.object({
  gigId: z.string().uuid("Gig ID must be a valid UUID"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  triggeredBy: z.string().optional(),
});
