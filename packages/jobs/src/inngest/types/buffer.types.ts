import { z } from "zod";

/**
 * Схемы событий буферизации сообщений
 */

export const messageBufferedDataSchema = z.object({
  userId: z.string().min(1, "ID пользователя обязателен"),
  conversationId: z.string().min(1, "ID разговора обязателен"),
  interviewStep: z
    .number()
    .int()
    .min(0, "Шаг интервью должен быть неотрицательным"),
  messageId: z.string().min(1, "ID сообщения обязателен"),
  timestamp: z
    .number()
    .int()
    .positive("Временная метка должна быть положительной"),
});

export const typingActivityDataSchema = z.object({
  userId: z.string().min(1, "ID пользователя обязателен"),
  conversationId: z.string().min(1, "ID разговора обязателен"),
  interviewStep: z
    .number()
    .int()
    .min(0, "Шаг интервью должен быть неотрицательным"),
  activityType: z.enum(["typing", "recording"], {
    message: "Тип активности должен быть 'typing' или 'recording'",
  }),
  timestamp: z
    .number()
    .int()
    .positive("Временная метка должна быть положительной"),
});

export const bufferFlushDataSchema = z.object({
  userId: z.string().min(1, "ID пользователя обязателен"),
  conversationId: z.string().min(1, "ID разговора обязателен"),
  interviewStep: z
    .number()
    .int()
    .min(0, "Шаг интервью должен быть неотрицательным"),
  flushId: z.string().min(1, "ID flush операции обязателен"),
  messageCount: z
    .number()
    .int()
    .min(0, "Количество сообщений должно быть неотрицательным"),
});

/**
 * Вывод типов
 */
export type MessageBufferedPayload = z.infer<typeof messageBufferedDataSchema>;
export type TypingActivityPayload = z.infer<typeof typingActivityDataSchema>;
export type BufferFlushPayload = z.infer<typeof bufferFlushDataSchema>;
