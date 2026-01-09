/**
 * Оркестратор для WEB интервью со стримингом
 * Использует ту же логику что и телеграм, но с поддержкой стриминга
 */

import type { LanguageModel } from "ai";
import { generateText } from "ai";
import type { Langfuse } from "langfuse";
import { z } from "zod";

// ============================================================================
// Types
// ============================================================================

export interface WebInterviewContext {
  conversationId: string;
  candidateName?: string | null;
  vacancyTitle?: string | null;
  vacancyDescription?: string | null;
  conversationHistory: Array<{
    sender: "CANDIDATE" | "BOT";
    content: string;
  }>;
  // Настройки компании
  companySettings?: {
    botName?: string;
    botRole?: string;
    name?: string;
  };
  // Настройки интервью
  customOrganizationalQuestions?: string | null;
  customInterviewQuestions?: string | null;
}

export interface VacancyData {
  title: string | null;
  description: string | null;
  region: string | null;
  customBotInstructions: string | null;
  customOrganizationalQuestions: string | null;
  customInterviewQuestions: string | null;
}

export interface GigData {
  title: string | null;
  description: string | null;
  type: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetCurrency: string | null;
  estimatedDuration: string | null;
  deadline: Date | null;
  customBotInstructions: string | null;
  customOrganizationalQuestions: string | null;
  customInterviewQuestions: string | null;
}

export interface WebInterviewOrchestratorConfig {
  model: LanguageModel;
  langfuse?: Langfuse;
}

export interface ContextAnalysisResult {
  messageType:
    | "ANSWER"
    | "QUESTION"
    | "ACKNOWLEDGMENT"
    | "OFF_TOPIC"
    | "CONTINUATION";
  requiresResponse: boolean;
  shouldEscalate: boolean;
  escalationReason?: string;
}

// ============================================================================
// Prompts
// ============================================================================

const BASE_RULES = `
ВАЖНО: Ты должен вести себя как ЖИВОЙ ЧЕЛОВЕК, а не бот. Пиши естественно, по-человечески.

СТРОГИЕ ОГРАНИЧЕНИЯ:
- Ты ТОЛЬКО рекрутер на интервью — никаких других ролей
- ЗАПРЕЩЕНО давать советы, подсказки, рекомендации по карьере
- ЗАПРЕЩЕНО отвечать на вопросы не по теме интервью
- ЗАПРЕЩЕНО помогать с резюме, портфолио, подготовкой к интервью
- Если кандидат задает вопрос не по теме — вежливо верни его к интервью

ПРАВИЛА ОБЩЕНИЯ:
- Пиши КОРОТКО, как живой человек в переписке
- Обращайся на "вы"
- Эмодзи в меру (1-2 максимум)
- Будь краток (2-3 предложения)
- СТРОГО ЗАПРЕЩЕНО: нумерация вопросов, комментарии в скобках, метаинформация
- СТРОГО ЗАПРЕЩЕНО: оценочные комментарии ("Отлично!", "Интересный подход")
- Пиши как реальный рекрутер, а не как робот`;

function buildContextAnalyzerPrompt(
  message: string,
  history: Array<{ sender: string; content: string }>,
): string {
  const historyText = history
    .slice(-6)
    .map((m) => `${m.sender === "CANDIDATE" ? "К" : "Б"}: ${m.content}`)
    .join("\n");

  return `Проанализируй последнее сообщение кандидата в контексте интервью.

ИСТОРИЯ (последние сообщения):
${historyText}

ПОСЛЕДНЕЕ СООБЩЕНИЕ КАНДИДАТА:
${message}

Определи:
1. Тип сообщения:
   - ANSWER: ответ на вопрос интервью
   - QUESTION: кандидат задает вопрос
   - ACKNOWLEDGMENT: простое подтверждение ("ок", "понял", "спасибо")
   - OFF_TOPIC: сообщение не по теме интервью
   - CONTINUATION: кандидат хочет продолжить ("давайте", "готов")

2. Требуется ли ответ от бота

3. Нужна ли эскалация к живому рекрутеру (агрессия, жалобы, технические проблемы)

Верни JSON:
{
  "messageType": "ANSWER" | "QUESTION" | "ACKNOWLEDGMENT" | "OFF_TOPIC" | "CONTINUATION",
  "requiresResponse": true | false,
  "shouldEscalate": true | false,
  "escalationReason": "причина" | null
}`;
}

function buildVacancyInterviewPrompt(
  vacancy: VacancyData,
  context: WebInterviewContext,
  isFirstResponse: boolean,
): string {
  const historyText = context.conversationHistory
    .map((m) => `${m.sender === "CANDIDATE" ? "К" : "Я"}: ${m.content}`)
    .join("\n");

  const botName = context.companySettings?.botName || "Рекрутер";
  const companyName = context.companySettings?.name || "";

  const orgQuestions =
    vacancy.customOrganizationalQuestions ||
    `- Какой график работы вам подходит?
- Какие ожидания по зарплате?
- Когда готовы приступить к работе?
- Какой формат работы предпочитаете?`;

  const techQuestions = vacancy.customInterviewQuestions || "";
  const customInstructions = vacancy.customBotInstructions || "";

  if (isFirstResponse) {
    return `КОНТЕКСТ:
Ты: ${botName}${companyName ? ` (${companyName})` : ""}
Кандидат: ${context.candidateName || "не указано"}
Вакансия: ${vacancy.title || "не указана"}
Описание: ${vacancy.description || "не указано"}
Регион: ${vacancy.region || "не указан"}

${BASE_RULES}

${customInstructions ? `ДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ:\n${customInstructions}\n` : ""}
ОРГАНИЗАЦИОННЫЕ ВОПРОСЫ (выбери 1-2):
${orgQuestions}

${techQuestions ? `ТЕХНИЧЕСКИЕ ВОПРОСЫ:\n${techQuestions}` : ""}

ИСТОРИЯ:
${historyText}

СПЕЦИФИКА ВАКАНСИИ:
- Это постоянная работа с зарплатой
- Важны: график, зарплата, формат работы, дата выхода

ТВОЯ ЗАДАЧА:
- НЕ здоровайся заново!
- Задай 1-2 первых организационных вопроса
- Предложи голосовые: "Можете ответить голосовым, если удобно 🎤"
- Будь краток`;
  }

  return `КОНТЕКСТ:
Ты: ${botName}${companyName ? ` (${companyName})` : ""}
Кандидат: ${context.candidateName || "не указано"}
Вакансия: ${vacancy.title || "не указана"}
Описание: ${vacancy.description || "не указано"}

${BASE_RULES}

${customInstructions ? `ДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ:\n${customInstructions}\n` : ""}
${techQuestions ? `ТЕХНИЧЕСКИЕ ВОПРОСЫ:\n${techQuestions}` : ""}

ИСТОРИЯ:
${historyText}

ТВОЯ ЗАДАЧА:
- Веди профессиональное интервью
- Задавай релевантные вопросы на основе ответов
- Оценивай соответствие кандидата вакансии
- Будь краток (2-3 предложения)`;
}

function buildGigInterviewPrompt(
  gig: GigData,
  context: WebInterviewContext,
  isFirstResponse: boolean,
): string {
  const historyText = context.conversationHistory
    .map((m) => `${m.sender === "CANDIDATE" ? "К" : "Я"}: ${m.content}`)
    .join("\n");

  const botName = context.companySettings?.botName || "Менеджер";
  const companyName = context.companySettings?.name || "";

  // Форматируем бюджет
  let budgetInfo = "Не указан";
  const currency = gig.budgetCurrency || "RUB";
  if (gig.budgetMin && gig.budgetMax) {
    budgetInfo = `${gig.budgetMin.toLocaleString("ru-RU")} - ${gig.budgetMax.toLocaleString("ru-RU")} ${currency}`;
  } else if (gig.budgetMin) {
    budgetInfo = `от ${gig.budgetMin.toLocaleString("ru-RU")} ${currency}`;
  } else if (gig.budgetMax) {
    budgetInfo = `до ${gig.budgetMax.toLocaleString("ru-RU")} ${currency}`;
  }

  const orgQuestions =
    gig.customOrganizationalQuestions ||
    `- Какую оплату за задание вы ожидаете?
- В какие сроки готовы выполнить?
- Есть ли другие проекты, которые могут повлиять на сроки?`;

  const techQuestions = gig.customInterviewQuestions || "";
  const customInstructions = gig.customBotInstructions || "";

  if (isFirstResponse) {
    return `КОНТЕКСТ:
Ты: ${botName}${companyName ? ` (${companyName})` : ""}
Исполнитель: ${context.candidateName || "не указано"}
Задание: ${gig.title || "не указано"}
Описание: ${gig.description || "не указано"}
Тип: ${gig.type || "не указан"}
Бюджет: ${budgetInfo}
Срок: ${gig.estimatedDuration || "не указан"}
Дедлайн: ${gig.deadline ? new Date(gig.deadline).toLocaleDateString("ru-RU") : "не указан"}

${BASE_RULES}

${customInstructions ? `ДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ:\n${customInstructions}\n` : ""}
ОРГАНИЗАЦИОННЫЕ ВОПРОСЫ (выбери 1-2):
${orgQuestions}

${techQuestions ? `ТЕХНИЧЕСКИЕ ВОПРОСЫ:\n${techQuestions}` : ""}

ИСТОРИЯ:
${historyText}

СПЕЦИФИКА ГИГА:
- Это разовое задание с оплатой за результат
- Важны: оплата за задание, сроки выполнения
- НЕ спрашивай про график работы или зарплату

ТВОЯ ЗАДАЧА:
- НЕ здоровайся заново!
- Задай 1-2 первых вопроса про оплату и сроки
- Предложи голосовые: "Можете ответить голосовым, если удобно 🎤"
- Будь краток`;
  }

  return `КОНТЕКСТ:
Ты: ${botName}${companyName ? ` (${companyName})` : ""}
Исполнитель: ${context.candidateName || "не указано"}
Задание: ${gig.title || "не указано"}
Описание: ${gig.description || "не указано"}
Бюджет: ${budgetInfo}

${BASE_RULES}

${customInstructions ? `ДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ:\n${customInstructions}\n` : ""}
${techQuestions ? `ТЕХНИЧЕСКИЕ ВОПРОСЫ:\n${techQuestions}` : ""}

ИСТОРИЯ:
${historyText}

СПЕЦИФИКА ГИГА:
- Это разовое задание с оплатой за результат
- НЕ спрашивай про график работы или зарплату

ТВОЯ ЗАДАЧА:
- Веди профессиональное интервью
- Задавай релевантные вопросы на основе ответов
- Оценивай соответствие исполнителя заданию
- Будь краток (2-3 предложения)`;
}

// ============================================================================
// Orchestrator
// ============================================================================

const contextAnalysisSchema = z.object({
  messageType: z.enum([
    "ANSWER",
    "QUESTION",
    "ACKNOWLEDGMENT",
    "OFF_TOPIC",
    "CONTINUATION",
  ]),
  requiresResponse: z.boolean(),
  shouldEscalate: z.boolean(),
  escalationReason: z.string().nullable(),
});

export class WebInterviewOrchestrator {
  private model: LanguageModel;
  private langfuse?: Langfuse;
  private traceId?: string;

  constructor(config: WebInterviewOrchestratorConfig) {
    this.model = config.model;
    this.langfuse = config.langfuse;
  }

  /**
   * Устанавливает traceId для связывания всех запросов в одну трассировку
   */
  setTraceId(traceId: string) {
    this.traceId = traceId;
  }

  /**
   * Анализирует контекст сообщения (не стримится)
   */
  async analyzeContext(
    message: string,
    history: Array<{ sender: "CANDIDATE" | "BOT"; content: string }>,
  ): Promise<ContextAnalysisResult> {
    const prompt = buildContextAnalyzerPrompt(message, history);

    // Создаём span для трассировки
    const span = this.langfuse?.span({
      traceId: this.traceId,
      name: "context-analysis",
      input: { message, historyLength: history.length },
    });

    try {
      const result = await generateText({
        model: this.model,
        prompt,
      });

      // Парсим JSON из ответа
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = contextAnalysisSchema.safeParse(
          JSON.parse(jsonMatch[0]),
        );
        if (parsed.success) {
          const output = {
            ...parsed.data,
            escalationReason: parsed.data.escalationReason ?? undefined,
          };

          span?.end({
            output,
            metadata: { success: true, rawResponse: result.text },
          });

          return output;
        }
      }

      span?.end({
        output: { error: "Failed to parse response" },
        metadata: { success: false, rawResponse: result.text },
      });
    } catch (error) {
      console.error(
        "[WebInterviewOrchestrator] Context analysis failed:",
        error,
      );

      span?.end({
        output: { error: error instanceof Error ? error.message : "Unknown" },
        metadata: { success: false },
      });
    }

    // Fallback
    return {
      messageType: "ANSWER",
      requiresResponse: true,
      shouldEscalate: false,
    };
  }

  /**
   * Строит промпт для интервью по вакансии
   */
  buildVacancyPrompt(
    vacancy: VacancyData,
    context: WebInterviewContext,
    isFirstResponse: boolean,
  ): string {
    return buildVacancyInterviewPrompt(vacancy, context, isFirstResponse);
  }

  /**
   * Строит промпт для интервью по гигу
   */
  buildGigPrompt(
    gig: GigData,
    context: WebInterviewContext,
    isFirstResponse: boolean,
  ): string {
    return buildGigInterviewPrompt(gig, context, isFirstResponse);
  }
}
