import { z } from "zod";

export const messageMediaSchema = z.object({
  type: z.string(),
  fileId: z.string().optional(),
  mimeType: z.string().optional(),
  duration: z.number().optional(),
}) satisfies z.ZodType;

export const messageSenderSchema = z.object({
  type: z.string(),
  username: z.string().optional(),
  firstName: z.string().optional(),
}) satisfies z.ZodType;

export const messageDataSchema = z.object({
  id: z.number(),
  chatId: z.string().min(1),
  text: z.string().optional(),
  isOutgoing: z.boolean(),
  media: messageMediaSchema.optional(),
  sender: messageSenderSchema.optional(),
}) satisfies z.ZodType;

export type MessageData = z.infer<typeof messageDataSchema>;
