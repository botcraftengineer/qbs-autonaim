import { z } from "zod";

/**
 * Freelance-related event schemas
 */

export const generateInvitationDataSchema = z.object({
  responseId: z.string().uuid(),
});

/**
 * Type inference
 */
export type GenerateInvitationPayload = z.infer<
  typeof generateInvitationDataSchema
>;
