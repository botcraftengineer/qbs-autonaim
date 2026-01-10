/**
 * Универсальный построитель промптов для AI чата
 */

import type { ChatContext, ChatHistoryMessage, PromptConfig } from "./types";

/**
 * Форматирует историю диалога
 */
function formatConversationHistory(history: ChatHistoryMessage[]): string {
  if (history.length === 0) {
    return "";
  }

  // Ограничиваем историю до 10 последних сообщений
  const recentHistory = history.slice(-10);

  const parts: string[] = [];
  parts.push(`# История диалога\n`);

  for (const message of recentHistory) {
    const role =
      message.role === "user"
        ? "Пользователь"
        : message.role === "assistant"
          ? "Ассистент"
          : "Система";
    parts.push(`**${role}:** ${message.content}\n`);
  }

  return parts.join("\n");
}

/**
 * Строит полный промпт для AI чата
 */
export function buildChatPrompt(
  userMessage: string,
  context: ChatContext,
  conversationHistory: ChatHistoryMessage[],
  config: PromptConfig,
): string {
  const parts: string[] = [];

  // Системная инструкция
  parts.push(config.systemRole);

  // Контекст основной сущности
  parts.push(`\n---\n`);
  parts.push(config.contextFormatters.main(context.mainContext));

  // Связанный контекст
  if (Object.keys(context.relatedContext).length > 0) {
    parts.push(`\n---\n`);
    parts.push(config.contextFormatters.related(context.relatedContext));
  }

  // Статистика
  if (Object.keys(context.statistics).length > 0) {
    parts.push(`\n---\n`);
    parts.push(config.contextFormatters.statistics(context.statistics));
  }

  // История диалога (если есть)
  if (conversationHistory.length > 0) {
    parts.push(`\n---\n`);
    parts.push(formatConversationHistory(conversationHistory));
  }

  // Текущий вопрос пользователя
  parts.push(`\n---\n`);
  parts.push(`# Текущий вопрос\n`);
  parts.push(`**Пользователь:** ${userMessage}`);

  return parts.join("\n");
}
