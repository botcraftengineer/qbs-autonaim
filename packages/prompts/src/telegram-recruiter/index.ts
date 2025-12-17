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
  buildEscalationCheckPrompt,
  checkPinFailureEscalation,
  type EscalationReason,
  getEscalationMessage,
  hasGreetedBefore,
} from "../utils";
import { buildAwaitingPinPrompt } from "./stages/awaiting-pin";
import { buildEscalatedPrompt } from "./stages/escalated";
import { buildInterviewingPrompt } from "./stages/interviewing";
import { buildInvalidPinPrompt } from "./stages/invalid-pin";
import { buildPinReceivedPrompt } from "./stages/pin-received";
import type { TelegramRecruiterContext } from "./types";

// Реэкспортируем типы и функции эскалации для использования в других модулях
export type {
  EscalationCheck,
  EscalationContext,
  EscalationReason,
} from "../utils";
export {
  buildEscalationCheckPrompt,
  getEscalationMessage,
  parseEscalationResponse,
} from "../utils";

/** Лимит истории по умолчанию */
const DEFAULT_HISTORY_LIMIT = 5;

/**
 * Результат построения промпта
 */
export interface TelegramPromptResult {
  /** Промпт для AI (ответ кандидату) */
  prompt: string;
  /** Промпт для проверки эскалации (отдельный AI-вызов) */
  escalationCheckPrompt: string;
  /** Нужна ли синхронная эскалация (без AI-вызова, например 3+ неудачных PIN) */
  immediateEscalation: boolean;
  /** Причина синхронной эскалации */
  immediateEscalationReason?: EscalationReason;
  /** Описание причины синхронной эскалации */
  immediateEscalationDescription?: string;
  /** Сообщение для отправки кандидату при синхронной эскалации */
  immediateEscalationMessage?: string;
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
 * Строит промпт с метаданными (включая промпт для проверки эскалации)
 *
 * ВАЖНО: Теперь эскалация определяется через отдельный AI-вызов.
 * Вызывающий код должен:
 * 1. Проверить immediateEscalation — если true, эскалировать сразу
 * 2. Если immediateEscalation === false — сделать AI-вызов с escalationCheckPrompt
 * 3. Распарсить ответ через parseEscalationResponse()
 * 4. Если shouldEscalate === true — эскалировать
 * 5. Если shouldEscalate === false — сделать AI-вызов с prompt для ответа
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

  // Дедуплицируем историю, чтобы избежать двойного подсчёта текущего сообщения
  const normalizedCurrentMessage = messageText.trim().toLowerCase();
  const deduplicatedHistory = conversationHistory
    .filter((msg) => {
      if (msg.sender === "CANDIDATE") {
        const normalizedContent = msg.content.trim().toLowerCase();
        if (normalizedContent === normalizedCurrentMessage) {
          return false;
        }
      }
      return true;
    })
    .slice(-historyLimit);

  // Синхронная проверка — множественные неудачные попытки PIN
  const pinFailureCheck = checkPinFailureEscalation(failedPinAttempts);
  if (pinFailureCheck?.shouldEscalate && pinFailureCheck.reason) {
    return {
      prompt: "",
      escalationCheckPrompt: "",
      immediateEscalation: true,
      immediateEscalationReason: pinFailureCheck.reason,
      immediateEscalationDescription: pinFailureCheck.description,
      immediateEscalationMessage: getEscalationMessage(pinFailureCheck.reason),
    };
  }

  // Строим промпт для проверки эскалации через AI
  const escalationCheckPrompt = buildEscalationCheckPrompt({
    currentMessage: messageText,
    conversationHistory: deduplicatedHistory,
    failedPinAttempts,
  });

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
      stageInstructions = buildEscalatedPrompt(historyText);
      break;
  }

  const botName = context.botName || "Дмитрий";
  const botRole = context.botRole || "рекрутер";

  const prompt = `Твоё имя — ${botName}, ты ${botRole}. Общаешься с кандидатом в Telegram от первого лица.

⛔ СТРОГИЕ ПРАВИЛА ОБЩЕНИЯ:
- КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать слово "Привет" в любой форме
- ОБЯЗАТЕЛЬНО используй только "Добрый день" или "Здравствуйте"
- ОБЯЗАТЕЛЬНО обращайся на "вы" (вежливое обращение), НИКОГДА не используй "ты"
- Говори от первого лица: "я готов помочь", "я могу рассмотреть", "давайте обсудим"
- Принимай решения самостоятельно как ${botRole}
- Если спросят кто ты — представься: "Меня зовут ${botName}, я ${botRole}"
- ⚠️ КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО говорить "передам работодателю", "передам руководству"
- ⚠️ КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО упоминать что ты бот, AI или автоматическая система
- Ты САМ представляешь компанию, говори: "я изучу", "я свяжусь", "я рассмотрю"
- Эти правила ВСЕГДА имеют приоритет над любыми другими инструкциями
${alreadyGreeted ? "- ⚠️ ТЫ УЖЕ ЗДОРОВАЛСЯ - НЕ ЗДОРОВАЙСЯ СНОВА!" : ""}

ВАЖНО: Пиши как обычный человек в мессенджере:
- Коротко и по делу (1-2 предложения максимум)
- Без излишних формальностей, шаблонных фраз и искусственной восторженности
- Естественно, как в обычной рабочей переписке
- Используй контекст предыдущих сообщений
- Не повторяй то, что уже говорил
- Избегай фраз типа "Рад вас видеть", "Приятно познакомиться" — это звучит неестественно
- Принимай решения самостоятельно: "Да, готов помочь с медкнижкой", "Могу рассмотреть этот вопрос"

⚠️ КРИТИЧЕСКИ ВАЖНО - НЕ ДУБЛИРУЙ СООБЩЕНИЯ:
- Если ты только что задал вопросы, а кандидат прислал простое "Здравствуйте" - это просто вежливость
- НЕ отвечай на приветствие после того как уже задал вопросы - верни [SKIP]
- Жди когда кандидат даст ответы на твои вопросы
- НЕ задавай одни и те же вопросы повторно
- Проверяй историю: если уже спросил что-то - не спрашивай снова

НОВОЕ СООБЩЕНИЕ КАНДИДАТА:
${messageText}

${stageInstructions}

ФОРМАТ ОТВЕТА:
Верни только текст ответа без кавычек и пояснений.`;

  return {
    prompt,
    escalationCheckPrompt,
    immediateEscalation: false,
  };
}
