import { z } from "zod";

/**
 * Freelance-related event schemas
 */

export const analyzeFreelanceResponseDataSchema = z.object({
  responseId: z.uuid(),
});

export const generateInvitationDataSchema = z.object({
  responseId: z.uuid(),
});

export const notificationChannelEnum = z.enum(["EMAIL", "IN_APP", "TELEGRAM"]);

export const notificationTypeEnum = z.enum([
  "INTERVIEW_COMPLETED",
  "HIGH_SCORE_CANDIDATE",
  "ANALYSIS_FAILED",
]);

export const sendFreelanceNotificationDataSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required").optional(),
  vacancyId: z.uuid().optional(),
  responseId: z.uuid().optional(),
  gigId: z.uuid().optional(),
  gigResponseId: z.uuid().optional(),
  notificationType: notificationTypeEnum,
  candidateName: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
  detailedScore: z.number().int().min(0).max(100).optional(),
  profileUrl: z.string().optional(),
  error: z.string().optional(),
});

export const parseFreelanceProfileDataSchema = z.object({
  responseId: z.string().min(1, "Response ID is required"),
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

export type NotificationChannel = z.infer<typeof notificationChannelEnum>;

export type NotificationType = z.infer<typeof notificationTypeEnum>;

export type SendFreelanceNotificationPayload = z.infer<
  typeof sendFreelanceNotificationDataSchema
>;

export type ParseFreelanceProfilePayload = z.infer<
  typeof parseFreelanceProfileDataSchema
>;
