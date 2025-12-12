/**
 * Утилиты для детекции необходимости эскалации к другому специалисту
 *
 * Определяет ситуации, когда диалог нужно передать коллеге
 */

/**
 * Паттерны сообщений, требующих эскалации
 */
const ESCALATION_PATTERNS = {
  /** Явные просьбы о человеке */
  humanRequest: [
    /(?:хочу|можно|дайте|соедините|свяжите|позовите)\s+(?:с\s+)?(?:человек|менеджер|рекрутер|hr|живо)/i,
    /с\s+(?:человек|живым|настоящ)\s+(?:рекрутер|менеджер|сотрудник)/i,
    /(?:вы\s+)?(?:бот|робот|автоответчик|ии|ai|искусственный)/i,
    /поговорить\s+с\s+(?:кем-то|человеком)/i,
    /есть\s+(?:живой|настоящий)/i,
  ],

  /** Жалобы и негатив */
  complaints: [
    /(?:не\s+)?(?:понимаю|понимаете|понял)/i,
    /(?:это\s+)?(?:не\s+)?(?:то|правильно|верно)/i,
    /(?:опять|снова|ещё|еще)\s+(?:ту\s+же|то\s+же|одно\s+и)/i,
    /(?:бесполезн|бессмыслен|глуп)/i,
    /(?:ужасн|кошмар|катастроф)/i,
  ],

  /** Сложные вопросы за рамками компетенции */
  complexQuestions: [
    /(?:юрид|правов|закон|договор|контракт|трудов\s+кодекс)/i,
    /(?:медицин|больнич|отпуск|декрет)/i,
    /(?:виза|разрешен|гражданств)/i,
    /(?:суд|иск|претензия|жалоб)/i,
  ],

  /** Отказ от продолжения */
  refusal: [
    /(?:не\s+хочу|не\s+буду)\s+(?:записы|отвеча|продолжа)/i,
    /(?:прекрати|останови|заверши|хватит)/i,
    /(?:отстань|отвали|надоел)/i,
  ],
} as const;

/**
 * Причины эскалации
 */
export type EscalationReason =
  | "HUMAN_REQUESTED" // Кандидат просит связаться с человеком
  | "COMPLAINT" // Кандидат жалуется
  | "COMPLEX_QUESTION" // Сложный вопрос за рамками компетенции
  | "REFUSAL" // Кандидат отказывается продолжать
  | "MULTIPLE_FAILED_ATTEMPTS"; // Множество неуспешных попыток

/**
 * Результат проверки необходимости эскалации
 */
export interface EscalationCheck {
  /** Нужна ли эскалация */
  shouldEscalate: boolean;
  /** Причина эскалации */
  reason?: EscalationReason;
  /** Описание причины для логирования */
  description?: string;
  /** Уровень уверенности (0-1) */
  confidence?: number;
}

/**
 * Проверяет, нужна ли эскалация к живому рекрутеру
 *
 * @param context - Контекст для проверки
 * @returns Результат проверки
 */
export function checkEscalationNeeded(context: {
  /** Текущее сообщение кандидата */
  currentMessage: string;
  /** История сообщений */
  conversationHistory?: Array<{ sender: string; content: string }>;
  /** Количество неуспешных попыток идентификации */
  failedPinAttempts?: number;
}): EscalationCheck {
  const {
    currentMessage,
    conversationHistory = [],
    failedPinAttempts = 0,
  } = context;

  const message = currentMessage.toLowerCase().trim();

  // Проверка 1: Множество неуспешных попыток PIN
  if (failedPinAttempts >= 3) {
    return {
      shouldEscalate: true,
      reason: "MULTIPLE_FAILED_ATTEMPTS",
      description: `Кандидат ${failedPinAttempts} раз(а) ввёл неверный PIN`,
      confidence: 0.9,
    };
  }

  // Проверка 2: Явные просьбы о человеке
  for (const pattern of ESCALATION_PATTERNS.humanRequest) {
    if (pattern.test(message)) {
      return {
        shouldEscalate: true,
        reason: "HUMAN_REQUESTED",
        description: "Кандидат явно просит связаться с человеком",
        confidence: 0.95,
      };
    }
  }

  // Проверка 3: Жалобы (считаем только при повторных)
  const recentCandidateMessages = conversationHistory
    .filter((msg) => msg.sender === "CANDIDATE")
    .slice(-3);

  let complaintCount = 0;
  for (const msg of recentCandidateMessages) {
    for (const pattern of ESCALATION_PATTERNS.complaints) {
      if (pattern.test(msg.content)) {
        complaintCount++;
        break;
      }
    }
  }

  // Текущее сообщение тоже проверяем
  for (const pattern of ESCALATION_PATTERNS.complaints) {
    if (pattern.test(message)) {
      complaintCount++;
      break;
    }
  }

  if (complaintCount >= 2) {
    return {
      shouldEscalate: true,
      reason: "COMPLAINT",
      description: "Кандидат выражает недовольство несколько раз подряд",
      confidence: 0.8,
    };
  }

  // Проверка 4: Сложные вопросы
  for (const pattern of ESCALATION_PATTERNS.complexQuestions) {
    if (pattern.test(message)) {
      return {
        shouldEscalate: true,
        reason: "COMPLEX_QUESTION",
        description:
          "Кандидат задаёт сложный вопрос за рамками компетенции",
        confidence: 0.7,
      };
    }
  }

  // Проверка 5: Отказ от продолжения
  for (const pattern of ESCALATION_PATTERNS.refusal) {
    if (pattern.test(message)) {
      return {
        shouldEscalate: true,
        reason: "REFUSAL",
        description: "Кандидат отказывается продолжать диалог",
        confidence: 0.85,
      };
    }
  }

  return {
    shouldEscalate: false,
  };
}

/**
 * Генерирует сообщение для эскалации
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

    case "MULTIPLE_FAILED_ATTEMPTS":
      return "Похоже, возникли сложности с кодом. Передам ваш контакт коллеге, он поможет разобраться.";

    default:
      return "Передам ваш контакт коллеге для личной связи.";
  }
}
