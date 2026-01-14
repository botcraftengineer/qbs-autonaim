/**
 * Вспомогательные функции для работы с интервью
 *
 * Предоставляет утилиты для определения текущего состояния интервью
 * и получения контекстной информации.
 */

import { getQuestionCount } from "@qbs-autonaim/server-utils";

/**
 * Получить текущий шаг интервью (номер вопроса)
 *
 * Использует существующую функцию getQuestionCount для определения
 * на каком вопросе находится кандидат в данный момент.
 *
 * @param conversationId - ID разговора
 * @returns Promise с номером текущего шага интервью (0-based)
 *
 * @example
 * ```typescript
 * const step = await getCurrentInterviewStep("conv-123");
 * console.log(`Кандидат на вопросе ${step + 1}`);
 * ```
 */
export async function getCurrentInterviewStep(
  conversationId: string,
): Promise<number> {
  return await getQuestionCount(conversationId);
}
