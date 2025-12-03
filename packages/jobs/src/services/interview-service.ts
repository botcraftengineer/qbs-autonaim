import { eq } from "@selectio/db";
import { db } from "@selectio/db/client";
import { telegramConversation } from "@selectio/db/schema";
import { stripHtml } from "string-strip-html";
import { generateText } from "../lib/ai-client";
import {
  type InterviewAnalysis,
  type InterviewScoring,
  interviewAnalysisSchema,
  interviewScoringSchema,
} from "../schemas/interview";
import { extractJsonFromText } from "../utils/json-extractor";
import { extractFirstName } from "../utils/name-extractor";

interface InterviewContext {
  conversationId: string;
  candidateName: string | null;
  vacancyTitle: string | null;
  vacancyDescription: string | null;
  currentAnswer: string;
  currentQuestion: string;
  previousQA: Array<{ question: string; answer: string }>;
  questionNumber: number;
  responseId: string | null;
}

/**
 * Анализирует ответ кандидата и генерирует следующий вопрос
 */
export async function analyzeAndGenerateNextQuestion(
  context: InterviewContext,
): Promise<InterviewAnalysis> {
  const {
    questionNumber,
    currentAnswer,
    currentQuestion,
    previousQA,
    candidateName,
    vacancyTitle,
  } = context;

  // Максимум 4 вопроса
  if (questionNumber >= 4) {
    return {
      analysis: "Достигнут максимум вопросов",
      shouldContinue: false,
      reason: "Достигнут лимит вопросов",
    };
  }

  const prompt = buildInterviewPrompt({
    candidateName,
    vacancyTitle,
    currentAnswer,
    currentQuestion,
    previousQA,
    questionNumber,
  });

  const { text } = await generateText({
    prompt,
    temperature: 0.8,
    generationName: "interview-next-question",
    entityId: context.conversationId,
    metadata: {
      conversationId: context.conversationId,
      questionNumber,
    },
  });

  // Парсим JSON ответ
  try {
    const extracted = extractJsonFromText(text);

    if (!extracted) {
      throw new Error("JSON не найден в ответе");
    }

    const result = interviewAnalysisSchema.parse(extracted);

    return {
      ...result,
      shouldContinue: result.shouldContinue && questionNumber < 4,
    };
  } catch (error) {
    console.error("Ошибка парсинга ответа AI:", error);
    console.error("Ответ AI:", text);

    // Fallback: пытаемся продолжить с дефолтным вопросом
    return {
      analysis: "Не удалось проанализировать ответ",
      shouldContinue: questionNumber < 4,
      nextQuestion: "Расскажи подробнее о своем опыте",
    };
  }
}

function buildInterviewPrompt(params: {
  candidateName: string | null;
  vacancyTitle: string | null;
  currentAnswer: string;
  currentQuestion: string;
  previousQA: Array<{ question: string; answer: string }>;
  questionNumber: number;
}): string {
  const {
    candidateName,
    vacancyTitle,
    currentAnswer,
    currentQuestion,
    previousQA,
    questionNumber,
  } = params;

  const name = extractFirstName(candidateName);

  return `Ты — опытный рекрутер, который проводит предварительное интервью с кандидатом через голосовые сообщения в Telegram.

ВАЖНО: Ты должен вести себя как ЖИВОЙ ЧЕЛОВЕК, а не бот. Пиши естественно, по-человечески, как в обычной переписке.

КОНТЕКСТ:
- Кандидат: ${name}
- Вакансия: ${vacancyTitle || "не указана"}
- Текущий вопрос: ${questionNumber}
- Максимум вопросов: 4

ТЕКУЩИЙ ЗАДАННЫЙ ВОПРОС:
${currentQuestion}

${previousQA.length > 0 ? `ПРЕДЫДУЩИЕ ВОПРОСЫ И ОТВЕТЫ:\n${previousQA.map((qa, i) => `${i + 1}. Вопрос: ${qa.question}\n   Ответ: ${qa.answer}`).join("\n\n")}` : ""}

ПОСЛЕДНИЙ ОТВЕТ КАНДИДАТА НА ТЕКУЩИЙ ВОПРОС:
${currentAnswer}

ТВОЯ ЗАДАЧА:
1. Проанализируй ответ кандидата
2. Оцени, стоит ли задавать следующий вопрос (если кандидат уже все рассказал подробно, можно завершить интервью раньше)
3. Если да — сформулируй следующий вопрос

ПРАВИЛА:
- Пиши как живой человек в мессенджере, без формальностей
- Используй имя кандидата естественно (не в каждом сообщении)
- Вопросы должны быть короткими и конкретными
- Каждый следующий вопрос должен углублять понимание кандидата
- Задавай вопросы о мотивации, опыте, навыках, ожиданиях
- НЕ задавай технические задачи или тесты
- НЕ упоминай, что ты бот или AI
- Можешь использовать 1-2 эмодзи для естественности
- Между вопросом можешь добавить короткий комментарий к предыдущему ответу (1 предложение)

ФОРМАТ ОТВЕТА - ВЕРНИ ТОЛЬКО ВАЛИДНЫЙ JSON:
{
  "analysis": "краткая оценка ответа кандидата в 1-2 предложения",
  "shouldContinue": true или false,
  "reason": "причина завершения, если shouldContinue=false",
  "nextQuestion": "полный текст следующего сообщения кандидату, если shouldContinue=true"
}

Пример хорошего вопроса:
"Понятно, опыт интересный 👍 А что тебя больше всего мотивирует в работе?"

ВАЖНО: Верни ТОЛЬКО JSON, без дополнительного текста до или после.`;
}

/**
 * Получает контекст интервью из базы данных
 */
export async function getInterviewContext(
  conversationId: string,
  currentTranscription: string,
  currentQuestion: string,
): Promise<InterviewContext | null> {
  const conversation = await db.query.telegramConversation.findFirst({
    where: eq(telegramConversation.id, conversationId),
    with: {
      messages: {
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      },
      response: {
        with: {
          vacancy: true,
        },
      },
    },
  });

  if (!conversation) {
    return null;
  }

  // Парсим metadata
  let metadata: Record<string, unknown> = {};
  try {
    metadata = conversation.metadata ? JSON.parse(conversation.metadata) : {};
  } catch (e) {
    console.error("Ошибка парсинга metadata:", e);
  }

  const questionAnswers =
    (metadata.questionAnswers as Array<{
      question: string;
      answer: string;
    }>) || [];

  return {
    conversationId: conversation.id,
    candidateName: conversation.candidateName,
    vacancyTitle: conversation.response?.vacancy?.title || null,
    vacancyDescription: conversation.response?.vacancy?.description
      ? stripHtml(conversation.response.vacancy.description).result
      : null,
    currentAnswer: currentTranscription,
    currentQuestion,
    previousQA: questionAnswers,
    questionNumber: questionAnswers.length + 1,
    responseId: conversation.responseId || null,
  };
}

/**
 * Сохраняет вопрос и ответ в metadata разговора
 */
export async function saveQuestionAnswer(
  conversationId: string,
  question: string,
  answer: string,
) {
  const [conversation] = await db
    .select()
    .from(telegramConversation)
    .where(eq(telegramConversation.id, conversationId))
    .limit(1);

  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  let metadata: Record<string, unknown> = {};
  try {
    metadata = conversation.metadata ? JSON.parse(conversation.metadata) : {};
  } catch (e) {
    console.error("Ошибка парсинга metadata:", e);
  }

  const questionAnswers =
    (metadata.questionAnswers as Array<{
      question: string;
      answer: string;
    }>) || [];

  questionAnswers.push({ question, answer });
  metadata.questionAnswers = questionAnswers;

  await db
    .update(telegramConversation)
    .set({ metadata: JSON.stringify(metadata) })
    .where(eq(telegramConversation.id, conversationId));
}

/**
 * Создает финальный скоринг на основе всего интервью
 */
export async function createInterviewScoring(
  context: InterviewContext,
): Promise<InterviewScoring> {
  const { candidateName, vacancyTitle, vacancyDescription, previousQA } =
    context;

  const prompt = buildScoringPrompt({
    candidateName,
    vacancyTitle,
    vacancyDescription,
    previousQA,
  });

  const { text } = await generateText({
    prompt,
    temperature: 0.3,
    generationName: "interview-scoring",
    entityId: context.conversationId,
    metadata: {
      conversationId: context.conversationId,
      responseId: context.responseId,
    },
  });

  // Парсим JSON ответ
  try {
    const extracted = extractJsonFromText(text);

    if (!extracted) {
      throw new Error("JSON не найден в ответе");
    }

    const result = interviewScoringSchema.parse(extracted);

    return result;
  } catch (error) {
    console.error("Ошибка парсинга скоринга:", error);
    console.error("Ответ AI:", text);

    // Fallback: возвращаем средние значения
    return {
      score: 3,
      detailedScore: 50,
      analysis: "Не удалось проанализировать интервью автоматически",
    };
  }
}

function buildScoringPrompt(params: {
  candidateName: string | null;
  vacancyTitle: string | null;
  vacancyDescription: string | null;
  previousQA: Array<{ question: string; answer: string }>;
}): string {
  const { candidateName, vacancyTitle, vacancyDescription, previousQA } =
    params;

  const name = extractFirstName(candidateName) || "Кандидат";

  return `Ты — опытный рекрутер. Проанализируй интервью с кандидатом и дай оценку.

ИНФОРМАЦИЯ О ВАКАНСИИ:
Позиция: ${vacancyTitle || "Не указана"}
${vacancyDescription ? `Описание: ${vacancyDescription}` : ""}

КАНДИДАТ: ${name}

ИНТЕРВЬЮ (ВОПРОСЫ И ОТВЕТЫ):
${previousQA.map((qa, i) => `${i + 1}. Вопрос: ${qa.question}\n   Ответ: ${qa.answer}`).join("\n\n")}

ТВОЯ ЗАДАЧА:
Оцени кандидата по результатам интервью, учитывая:
- Мотивацию и заинтересованность
- Релевантность опыта
- Коммуникативные навыки
- Соответствие ожиданиям вакансии
- Общее впечатление

ФОРМАТ ОТВЕТА - ВЕРНИ ТОЛЬКО ВАЛИДНЫЙ JSON:
{
  "score": число от 1 до 5 (где 1 - не подходит, 5 - отлично подходит),
  "detailedScore": число от 0 до 100,
  "analysis": "подробный анализ кандидата на основе интервью, 3-5 предложений"
}

Будь объективным и конструктивным в оценке.

ВАЖНО: Верни ТОЛЬКО JSON, без дополнительного текста до или после.`;
}
