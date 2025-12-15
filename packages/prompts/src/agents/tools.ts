/**
 * Инструменты для агентов на базе AI SDK 6
 *
 * Эти инструменты предоставляют AI возможность анализировать контекст
 * и принимать решения на основе данных
 */

import { z } from "zod";

/**
 * Схема для сообщения в истории
 */
const messageSchema = z.object({
  sender: z.string().describe("Отправитель: CANDIDATE или BOT"),
  content: z.string().optional(),
  contentType: z.string().optional().describe("Тип контента: TEXT или VOICE"),
});

type Message = z.infer<typeof messageSchema>;

/**
 * Инструмент для получения информации о голосовых сообщениях
 * AI использует это для принятия решений о запросе голосовых
 */
export const getVoiceMessagesInfo = {
  description:
    "Получает информацию о количестве голосовых сообщений от кандидата в истории диалога",
  inputSchema: z.object({
    history: z.array(messageSchema).describe("История сообщений диалога"),
  }),
  execute: async ({ history }: { history: Message[] }) => {
    const voiceMessages = history.filter(
      (msg) => msg.sender === "CANDIDATE" && msg.contentType === "VOICE",
    );

    return {
      count: voiceMessages.length,
      hasEnough: voiceMessages.length >= 2,
      description: `Кандидат отправил ${voiceMessages.length} голосовых сообщений`,
    };
  },
};

/**
 * Инструмент для получения контекста диалога
 * AI использует это для понимания истории общения
 */
export const getConversationContext = {
  description: "Получает контекст и статистику текущего диалога с кандидатом",
  inputSchema: z.object({
    history: z.array(messageSchema).describe("История сообщений"),
  }),
  execute: async ({ history }: { history: Message[] }) => {
    const candidateMessages = history.filter((m) => m.sender === "CANDIDATE");
    const botMessages = history.filter((m) => m.sender === "BOT");
    const voiceCount = history.filter(
      (m) => m.sender === "CANDIDATE" && m.contentType === "VOICE",
    ).length;

    return {
      totalMessages: history.length,
      candidateMessages: candidateMessages.length,
      botMessages: botMessages.length,
      voiceMessages: voiceCount,
      lastCandidateMessage:
        candidateMessages[candidateMessages.length - 1]?.content,
      conversationLength: history.length,
    };
  },
};
