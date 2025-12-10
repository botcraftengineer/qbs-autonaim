import { generateText } from "@qbs-autonaim/lib";

interface GenerateResponseParams {
  messageText: string;
  candidateName?: string;
  vacancyTitle?: string;
  responseStatus?: string;
  conversationHistory?: Array<{ sender: string; content: string }>;
  isIdentified?: boolean;
}

/**
 * Генерирует ответ через AI, имитируя живого рекрутера
 */
export async function generateAIResponse(
  params: GenerateResponseParams,
): Promise<string> {
  const {
    messageText,
    candidateName,
    vacancyTitle,
    responseStatus,
    conversationHistory = [],
    isIdentified = false,
  } = params;

  const historyText =
    conversationHistory.length > 0
      ? conversationHistory
          .slice(-5)
          .map(
            (msg) =>
              `${msg.sender === "CANDIDATE" ? "Кандидат" : "Ты"}: ${msg.content}`,
          )
          .join("\n")
      : "";

  // Проверяем, похоже ли сообщение на PIN-код
  const isPinCode = /^\d{4}$/.test(messageText.trim());
  const isAuthAttempt = !isIdentified && isPinCode;

  const prompt = `Ты — ЖИВОЙ рекрутер, который общается с кандидатом в Telegram. Твоя задача — ответить на сообщение кандидата естественно и по-человечески.

КОНТЕКСТ:
${candidateName ? `Имя кандидата: ${candidateName}` : "Кандидат не идентифицирован"}
${vacancyTitle ? `Вакансия: ${vacancyTitle}` : ""}
${responseStatus ? `Статус отклика: ${responseStatus}` : ""}
${!isIdentified ? "⚠️ ВАЖНО: Кандидат НЕ идентифицирован в системе" : ""}
${isAuthAttempt ? "⚠️ КРИТИЧНО: Кандидат отправил 4-значный PIN-код — это попытка авторизации!" : ""}

${historyText ? `ИСТОРИЯ ПЕРЕПИСКИ:\n${historyText}\n` : ""}

СООБЩЕНИЕ КАНДИДАТА:
${messageText}

ТРЕБОВАНИЯ К ОТВЕТУ:
- Пиши как ЖИВОЙ ЧЕЛОВЕК, не как бот
- Будь дружелюбным, но профессиональным
- Используй "ты" в обращении
- Отвечай кратко и по делу (1-3 предложения)
- Если кандидат задает вопрос — отвечай на него
- Если кандидат рассказывает о себе — покажи заинтересованность
- Используй эмодзи умеренно (0-2 максимум)
- НЕ упоминай, что ты AI или бот
- НЕ используй шаблонные фразы
${
  isAuthAttempt
    ? `
- ⚠️ АВТОРИЗАЦИЯ: Кандидат пытается авторизоваться через PIN-код
- Подтверди получение кода и скажи, что проверяешь его
- Будь позитивным и обнадеживающим
- Например: "Отлично, проверяю твой код..." или "Секунду, сейчас проверю..."`
    : ""
}
${
  !isIdentified && !isAuthAttempt
    ? `
- ⚠️ НЕ ИДЕНТИФИЦИРОВАН: Кандидат еще не авторизован
- Если он спрашивает про вакансию/статус — вежливо попроси сначала авторизоваться
- Объясни, что нужно ввести 4-значный PIN-код из письма
- Будь терпеливым и помогающим`
    : ""
}
- Если статус "COMPLETED" — вежливо объясни, что процесс завершен
- Если статус "INTERVIEW_HH" — предложи обсудить детали
- Если нужна дополнительная информация — попроси ее

ФОРМАТ ОТВЕТА:
Верни только текст ответа без кавычек и пояснений.`;

  try {
    const { text } = await generateText({
      prompt,
      temperature: 0.7,
      generationName: "telegram-response",
      entityId: "telegram-chat",
      metadata: {
        messageText,
        candidateName,
      },
    });

    return text.trim();
  } catch (error) {
    console.error("Ошибка генерации AI ответа:", error);
    // Fallback на простой ответ
    return "Извини, что-то пошло не так. Можешь повторить?";
  }
}
