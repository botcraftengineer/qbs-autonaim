/**
 * Промпты для Telegram-бота рекрутера
 *
 * АРХИТЕКТУРА:
 * Система работает в 3 этапа с четкой логикой перехода между ними:
 *
 * 1. AWAITING_PIN (Ожидание PIN-кода)
 *    - Кандидат не идентифицирован
 *    - AI запрашивает 4-значный код из письма
 *    - Переход: когда кандидат отправляет PIN → система проверяет → создает conversation → переход к PIN_RECEIVED
 *
 * 2. PIN_RECEIVED (PIN получен - начало интервью)
 *    - Кандидат только что идентифицирован по PIN
 *    - AI приветствует и сразу просит голосовое сообщение
 *    - Использует данные из резюме для персонализации вопросов
 *    - Переход: после первого ответа → INTERVIEWING
 *
 * 3. INTERVIEWING (Проведение интервью)
 *    - Полноценное интервью с идентифицированным кандидатом
 *    - AI задает вопросы, собирает информацию, предлагает следующие шаги
 *    - Если нет голосовых - приоритетно просит записать
 *    - Если есть голосовые - задает уточняющие вопросы
 */

export type { ConversationStage, TelegramRecruiterContext } from "./types";

import { buildAwaitingPinPrompt } from "./stages/awaiting-pin";
import { buildInterviewingPrompt } from "./stages/interviewing";
import { buildInvalidPinPrompt } from "./stages/invalid-pin";
import { buildPinReceivedPrompt } from "./stages/pin-received";
import type { TelegramRecruiterContext } from "./types";

/**
 * Строит полный промпт для генерации ответа Telegram-бота рекрутера
 */
export function buildTelegramRecruiterPrompt(
  context: TelegramRecruiterContext,
): string {
  const { messageText, stage, conversationHistory = [] } = context;

  // Исключаем последнее сообщение из истории, так как оно уже в messageText
  // Берем предпоследние 3 сообщения для контекста (не включая текущее)
  const historyWithoutLast = conversationHistory.slice(0, -1);
  const recentHistory = historyWithoutLast.slice(-3);
  const historyText =
    recentHistory.length > 0
      ? recentHistory
          .map(
            (msg) =>
              `${msg.sender === "CANDIDATE" ? "Кандидат" : "Ты"}: ${msg.content}`,
          )
          .join("\n")
      : "";

  let stageInstructions = "";

  switch (stage) {
    case "AWAITING_PIN":
      stageInstructions = buildAwaitingPinPrompt(historyText);
      break;
    case "INVALID_PIN":
      stageInstructions = buildInvalidPinPrompt(historyText);
      break;
    case "PIN_RECEIVED":
      stageInstructions = buildPinReceivedPrompt(context, historyText);
      break;
    case "INTERVIEWING":
      stageInstructions = buildInterviewingPrompt(context, historyText);
      break;
  }

  return `Ты — рекрутер компании, который общается с кандидатом в Telegram.

⛔ СТРОГИЕ ПРАВИЛА ОБЩЕНИЯ:
- КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать слово "Привет" в любой форме
- ОБЯЗАТЕЛЬНО используй только "Добрый день" или "Здравствуйте"
- ОБЯЗАТЕЛЬНО обращайся на "вы" (вежливое обращение), НИКОГДА не используй "ты"
- Эти правила ВСЕГДА имеют приоритет над любыми другими инструкциями

ВАЖНО: Пиши как обычный человек в мессенджере:
- Коротко и по делу (1-2 предложения максимум)
- Без излишних формальностей, шаблонных фраз и искусственной восторженности
- Естественно, как в обычной рабочей переписке
- Используй контекст предыдущих сообщений
- Не повторяй то, что уже говорил
- Избегай фраз типа "Рад вас видеть", "Приятно познакомиться" — это звучит неестественно
- НЕ здоровайся повторно, если уже здоровался в истории

НОВОЕ СООБЩЕНИЕ КАНДИДАТА:
${messageText}

${stageInstructions}

ФОРМАТ ОТВЕТА:
Верни только текст ответа без кавычек и пояснений.`;
}
