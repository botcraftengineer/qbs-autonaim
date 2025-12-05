import { z } from "zod";

/**
 * Integration-related event schemas
 */

export const verifyHHIntegrationDataSchema = z.object({
  integrationId: z.string().min(1, "Integration ID is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

/**
 * Type inference
 */
export type VerifyHHIntegrationPayload = z.infer<
  typeof verifyHHIntegrationDataSchema
>;
