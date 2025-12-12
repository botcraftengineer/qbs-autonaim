/**
 * Промпты для Telegram-бота рекрутера
 *
 * АРХИТЕКТУРА:
 * Система работает в 4 этапа с четкой логикой перехода между ними:
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
 *
 * 4. ESCALATED (Эскалация к живому рекрутеру)
 *    - Диалог передан живому рекрутеру
 *    - AI больше не отвечает автоматически
 */

export type { ConversationStage, TelegramRecruiterContext } from "./types";

import {
  checkEscalationNeeded,
  getEscalationMessage,
  hasGreetedBefore,
} from "../utils";
import { buildAwaitingPinPrompt } from "./stages/awaiting-pin";
import { buildEscalatedPrompt } from "./stages/escalated";
import { buildInterviewingPrompt } from "./stages/interviewing";
import { buildInvalidPinPrompt } from "./stages/invalid-pin";
import { buildPinReceivedPrompt } from "./stages/pin-received";
import type { TelegramRecruiterContext } from "./types";

/** Лимит истории по умолчанию */
const DEFAULT_HISTORY_LIMIT = 5;

/**
 * Результат построения промпта
 */
export interface TelegramPromptResult {
  /** Промпт для AI */
  prompt: string;
  /** Нужна ли эскалация */
  shouldEscalate: boolean;
  /** Причина эскалации */
  escalationReason?: string;
  /** Сообщение для эскалации (если нужно) */
  escalationMessage?: string;
}

/**
 * Строит полный промпт для генерации ответа Telegram-бота рекрутера
 */
export function buildTelegramRecruiterPrompt(
  context: TelegramRecruiterContext,
): string {
  const result = buildTelegramRecruiterPromptWithMeta(context);
  return result.prompt;
}

/**
 * Строит промпт с метаданными (включая проверку эскалации)
 */
export function buildTelegramRecruiterPromptWithMeta(
  context: TelegramRecruiterContext,
): TelegramPromptResult {
  const {
    messageText,
    stage,
    conversationHistory = [],
    historyLimit = DEFAULT_HISTORY_LIMIT,
    failedPinAttempts = 0,
  } = context;

  // Проверяем необходимость эскалации
  const escalationCheck = checkEscalationNeeded({
    currentMessage: messageText,
    conversationHistory,
    failedPinAttempts,
  });

  if (escalationCheck.shouldEscalate && escalationCheck.reason) {
    return {
      prompt: "", // Промпт не нужен при эскалации
      shouldEscalate: true,
      escalationReason: escalationCheck.description,
      escalationMessage: getEscalationMessage(escalationCheck.reason),
    };
  }

  // Исключаем последнее сообщение из истории, так как оно уже в messageText
  // Берем предпоследние N сообщений для контекста (настраиваемый лимит)
  const historyWithoutLast = conversationHistory.slice(0, -1);
  const recentHistory = historyWithoutLast.slice(-historyLimit);
  const historyText =
    recentHistory.length > 0
      ? recentHistory
          .map(
            (msg) =>
              `${msg.sender === "CANDIDATE" ? "Кандидат" : "Ты"}: ${msg.content}`,
          )
          .join("\n")
      : "";

  // Проверяем, уже ли здоровались
  const alreadyGreeted = hasGreetedBefore(conversationHistory);

  let stageInstructions = "";

  switch (stage) {
    case "AWAITING_PIN":
      stageInstructions = buildAwaitingPinPrompt(historyText, alreadyGreeted);
      break;
    case "INVALID_PIN":
      stageInstructions = buildInvalidPinPrompt(historyText, alreadyGreeted);
      break;
    case "PIN_RECEIVED":
      stageInstructions = buildPinReceivedPrompt(
        context,
        historyText,
        alreadyGreeted,
      );
      break;
    case "INTERVIEWING":
      stageInstructions = buildInterviewingPrompt(
        context,
        historyText,
        alreadyGreeted,
      );
      break;
    case "ESCALATED":
      stageInstructions = buildEscalatedPrompt();
      break;
  }

  const prompt = `Ты — рекрутер компании, который общается с кандидатом в Telegram.

⛔ СТРОГИЕ ПРАВИЛА ОБЩЕНИЯ:
- КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать слово "Привет" в любой форме
- ОБЯЗАТЕЛЬНО используй только "Добрый день" или "Здравствуйте"
- ОБЯЗАТЕЛЬНО обращайся на "вы" (вежливое обращение), НИКОГДА не используй "ты"
- Эти правила ВСЕГДА имеют приоритет над любыми другими инструкциями
${alreadyGreeted ? "- ⚠️ ТЫ УЖЕ ЗДОРОВАЛСЯ - НЕ ЗДОРОВАЙСЯ СНОВА!" : ""}

ВАЖНО: Пиши как обычный человек в мессенджере:
- Коротко и по делу (1-2 предложения максимум)
- Без излишних формальностей, шаблонных фраз и искусственной восторженности
- Естественно, как в обычной рабочей переписке
- Используй контекст предыдущих сообщений
- Не повторяй то, что уже говорил
- Избегай фраз типа "Рад вас видеть", "Приятно познакомиться" — это звучит неестественно

НОВОЕ СООБЩЕНИЕ КАНДИДАТА:
${messageText}

${stageInstructions}

ФОРМАТ ОТВЕТА:
Верни только текст ответа без кавычек и пояснений.`;

  return {
    prompt,
    shouldEscalate: false,
  };
}
