import { z } from "zod";

/**
 * Telegram-related event schemas
 */

export const telegramMessageSendDataSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  chatId: z.string().min(1, "Chat ID is required"),
  content: z.string().min(1, "Content is required"),
});

export const voiceTranscriptionDataSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  fileId: z.string().min(1, "File ID is required"),
});

export const interviewAnalysisDataSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  transcription: z.string().min(1, "Transcription is required"),
});

export const interviewSendQuestionDataSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  question: z.string().min(1, "Question is required"),
  transcription: z.string().min(1, "Transcription is required"),
  questionNumber: z.number().int().min(0),
});

export const interviewCompleteDataSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  transcription: z.string().min(1, "Transcription is required"),
  reason: z.string().optional(),
  questionNumber: z.number().int().min(0),
  responseId: z.string().optional(),
});

/**
 * Type inference
 */
export type TelegramMessageSendPayload = z.infer<
  typeof telegramMessageSendDataSchema
>;
export type VoiceTranscriptionPayload = z.infer<
  typeof voiceTranscriptionDataSchema
>;
export type InterviewAnalysisPayload = z.infer<
  typeof interviewAnalysisDataSchema
>;
export type InterviewSendQuestionPayload = z.infer<
  typeof interviewSendQuestionDataSchema
>;
export type InterviewCompletePayload = z.infer<
  typeof interviewCompleteDataSchema
>;
