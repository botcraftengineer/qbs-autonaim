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

export const candidateOfferSendDataSchema = z.object({
  responseId: z.string().min(1, "Response ID is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  offerDetails: z.object({
    position: z.string().min(1, "Position is required"),
    salary: z.string().min(1, "Salary is required"),
    startDate: z.string().min(1, "Start date is required"),
    benefits: z.string().optional(),
    message: z.string().optional(),
  }),
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
export type CandidateOfferSendPayload = z.infer<
  typeof candidateOfferSendDataSchema
>;
