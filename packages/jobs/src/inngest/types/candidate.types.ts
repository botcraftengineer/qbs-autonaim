import { z } from "zod";

/**
 * Candidate-related event schemas
 */

export const candidateWelcomeDataSchema = z.object({
  responseId: z.string().min(1, "Response ID is required"),
  username: z.string().optional(),
  phone: z.string().optional(),
});

export const candidateWelcomeBatchDataSchema = z.object({
  responseIds: z
    .array(z.string())
    .min(1, "At least one response ID is required"),
});

/**
 * Type inference
 */
export type CandidateWelcomePayload = z.infer<
  typeof candidateWelcomeDataSchema
>;
export type CandidateWelcomeBatchPayload = z.infer<
  typeof candidateWelcomeBatchDataSchema
>;
