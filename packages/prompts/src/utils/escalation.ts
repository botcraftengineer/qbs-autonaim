/**
 * Утилиты для детекции необходимости эскалации к живому рекрутеру
 *
 * Эскалация определяется через отдельный AI-вызов с промптом
 */

/**
 * Причины эскалации
 */
export type EscalationReason =
  | "HUMAN_REQUESTED" // Кандидат просит связаться с человеком
  | "COMPLAINT" // Кандидат жалуется или выражает недовольство
  | "COMPLEX_QUESTION" // Сложный вопрос за рамками компетенции бота
  | "REFUSAL" // Кандидат отказывается продолжать
  | "AGGRESSIVE" // Агрессивное или грубое поведение
  | "URGENT" // Срочный вопрос, требующий немедленного внимания
  | "OTHER"; // Иная причина

/**
 * Результат проверки необходимости эскалации
 */
export interface EscalationCheck {
  /** Нужна ли эскалация */
  shouldEscalate: boolean;
  /** Причина эскалации */
  reason?: EscalationReason;
  /** Описание причины (человеко-читаемое) */
  description?: string;
  /** Уровень уверенности (0-1) */
  confidence?: number;
}

/**
 * Контекст для проверки эскалации
 */
export interface EscalationContext {
  /** Текущее сообщение кандидата */
  currentMessage: string;
  /** История сообщений (последние N) */
  conversationHistory?: Array<{ sender: string; content: string }>;
  /** Количество неуспешных попыток идентификации */
  failedPinAttempts?: number;
}

/**
 * Строит промпт для AI-проверки необходимости эскалации
 *
 * @param context - Контекст диалога
 * @returns Промпт для AI
 */
export function buildEscalationCheckPrompt(context: EscalationContext): string {
  const { currentMessage, conversationHistory = [], failedPinAttempts = 0 } = context;

  // Формируем историю диалога для контекста
  const historyText =
    conversationHistory.length > 0
      ? conversationHistory
          .slice(-5) // Берём последние 5 сообщений
          .map((msg) => `${msg.sender === "CANDIDATE" ? "Кандидат" : "Бот"}: ${msg.content}`)
          .join("\n")
      : "";

  return `Ты — система анализа диалогов рекрутингового бота. Твоя задача — определить, нужно ли передать диалог живому рекрутеру (эскалация).

ТЕКУЩЕЕ СООБЩЕНИЕ КАНДИДАТА:
${currentMessage}

${historyText ? `ИСТОРИЯ ДИАЛОГА (последние сообщения):\n${historyText}\n` : ""}
${failedPinAttempts > 0 ? `НЕУДАЧНЫХ ПОПЫТОК ВВОДА PIN: ${failedPinAttempts}\n` : ""}
КРИТЕРИИ ЭСКАЛАЦИИ:

1. HUMAN_REQUESTED — кандидат явно просит связаться с человеком:
   - "Хочу поговорить с человеком"
   - "Можно связаться с живым рекрутером?"
   - "Вы бот?" (с негативным контекстом)
   - Любые явные просьбы о человеческом контакте

2. COMPLAINT — кандидат выражает недовольство:
   - Жалобы на качество общения
   - Недовольство ответами бота
   - Повторяющиеся фразы "не понимаю", "это не то"
   - Раздражение от диалога

3. COMPLEX_QUESTION — сложный вопрос за рамками компетенции:
   - Юридические вопросы (договор, ТК, права)
   - Медицинские вопросы (больничные, декрет)
   - Специфические вопросы о компании, которые бот не может знать
   - Финансовые детали (точные суммы, бонусы, опционы)

4. REFUSAL — кандидат отказывается продолжать:
   - "Не хочу отвечать"
   - "Хватит вопросов"
   - "Прекратите"
   - Явный отказ от интервью

5. AGGRESSIVE — агрессивное поведение:
   - Грубость, оскорбления
   - Угрозы
   - Нецензурная лексика

6. URGENT — срочный вопрос:
   - Кандидат упоминает дедлайны
   - Срочные обстоятельства
   - Просьба о немедленном ответе

7. OTHER — другие ситуации, когда бот не справляется:
   - Кандидат явно в тупике
   - Диалог зациклился
   - Бот не понимает контекст

ВАЖНО:
- Если ${failedPinAttempts >= 3 ? "было 3+ неудачных попыток PIN — это автоматическая эскалация (HUMAN_REQUESTED)" : "неудачных попыток PIN меньше 3 — это ещё не повод для эскалации"}
- Обычные вопросы о вакансии, зарплате, графике — НЕ эскалация
- Нейтральные или позитивные сообщения — НЕ эскалация
- Сомневаешься — лучше НЕ эскалировать

ФОРМАТ ОТВЕТА (строго JSON):
{
  "shouldEscalate": true/false,
  "reason": "HUMAN_REQUESTED" | "COMPLAINT" | "COMPLEX_QUESTION" | "REFUSAL" | "AGGRESSIVE" | "URGENT" | "OTHER" | null,
  "description": "Краткое описание причины на русском" | null,
  "confidence": 0.0-1.0
}

Ответь ТОЛЬКО JSON без пояснений.`;
}

/**
 * Парсит ответ AI для проверки эскалации
 *
 * @param aiResponse - Ответ AI (ожидается JSON)
 * @returns Результат проверки эскалации
 */
export function parseEscalationResponse(aiResponse: string): EscalationCheck {
  try {
    // Пытаемся извлечь JSON из ответа (на случай если AI добавил текст вокруг)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { shouldEscalate: false };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      shouldEscalate?: boolean;
      reason?: string;
      description?: string;
      confidence?: number;
    };

    // Валидируем reason
    const validReasons: EscalationReason[] = [
      "HUMAN_REQUESTED",
      "COMPLAINT",
      "COMPLEX_QUESTION",
      "REFUSAL",
      "AGGRESSIVE",
      "URGENT",
      "OTHER",
    ];

    const reason = validReasons.includes(parsed.reason as EscalationReason)
      ? (parsed.reason as EscalationReason)
      : undefined;

    return {
      shouldEscalate: Boolean(parsed.shouldEscalate),
      reason: parsed.shouldEscalate ? reason : undefined,
      description: parsed.description ?? undefined,
      confidence:
        typeof parsed.confidence === "number"
          ? Math.max(0, Math.min(1, parsed.confidence))
          : undefined,
    };
  } catch {
    // Если не удалось распарсить — не эскалируем
    return { shouldEscalate: false };
  }
}

/**
 * Проверяет необходимость эскалации на основе количества неудачных попыток PIN
 * (синхронная проверка без AI — для очевидных случаев)
 *
 * @param failedPinAttempts - Количество неудачных попыток
 * @returns Результат проверки или null если нужен AI-вызов
 */
export function checkPinFailureEscalation(
  failedPinAttempts: number,
): EscalationCheck | null {
  if (failedPinAttempts >= 3) {
    return {
      shouldEscalate: true,
      reason: "HUMAN_REQUESTED",
      description: `Кандидат ${failedPinAttempts} раз(а) ввёл неверный PIN`,
      confidence: 0.95,
    };
  }
  return null;
}

/**
 * Генерирует сообщение для отправки кандидату при эскалации
 *
 * @param reason - Причина эскалации
 * @returns Сообщение для отправки кандидату
 */
export function getEscalationMessage(reason: EscalationReason): string {
  switch (reason) {
    case "HUMAN_REQUESTED":
      return "Понял, сейчас передам ваш контакт коллеге. Он свяжется с вами в ближайшее время.";

    case "COMPLAINT":
      return "Прошу прощения за неудобства. Передам ваш контакт специалисту, который поможет разобраться.";

    case "COMPLEX_QUESTION":
      return "Хороший вопрос, на него лучше ответит мой коллега. Передам ему ваш контакт, он перезвонит.";

    case "REFUSAL":
      return "Хорошо, понимаю. Если хотите, можем продолжить позже или передам ваш контакт коллеге.";

    case "AGGRESSIVE":
      return "Понимаю, что ситуация непростая. Передам ваш контакт коллеге для личного общения.";

    case "URGENT":
      return "Понял, что вопрос срочный. Передаю коллеге — он свяжется с вами в ближайшее время.";

    default:
      return "Передам ваш контакт коллеге для личной связи.";
  }
}
