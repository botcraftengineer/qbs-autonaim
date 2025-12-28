import { z } from "zod";

/**
 * Freelance-related event schemas
 */

export const analyzeFreelanceResponseDataSchema = z.object({
  responseId: z.string().uuid(),
});

export const generateInvitationDataSchema = z.object({
  responseId: z.string().uuid(),
});

/**
 * Type inference
 */
export type AnalyzeFreelanceResponsePayload = z.infer<
  typeof analyzeFreelanceResponseDataSchema
>;

export type GenerateInvitationPayload = z.infer<
  typeof generateInvitationDataSchema
>;
