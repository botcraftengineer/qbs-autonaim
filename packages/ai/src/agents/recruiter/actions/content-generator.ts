/**
 * ContentGeneratorAgent - Агент для генерации контента вакансий
 * Генерирует заголовки, описания, требования с SEO-оптимизацией
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../../core/base-agent";
import { AgentType } from "../../core/types";
import type { RecruiterAgentContext } from "../core/types";

/**
 * Тип генерируемого контента
 */
export type ContentType =
  | "title"
  | "description"
  | "requirements"
  | "benefits"
  | "full_vacancy";

/**
 * Входные данные для генерации контента
 */
export interface ContentGeneratorInput {
  type: ContentType;
  position: string;
  context?: {
    company?: string;
    industry?: string;
    skills?: string[];
    experience?: number;
    salaryFrom?: number;
    salaryTo?: number;
    location?: string;
    remote?: boolean;
    existingContent?: string; // Для улучшения существующего контента
  };
  tone?: "formal" | "casual" | "professional";
  generateVariants?: number; // Количество вариантов для A/B тестирования
}

/**
 * Вариант контента для A/B тестирования
 */
export interface ContentVariant {
  id: string;
  content: string;
  style: string;
  keywords: string[];
  estimatedCTR?: number; // Оценочный CTR на основе анализа
}

/**
 * Выходные данные генерации контента
 */
export interface ContentGeneratorOutput {
  primary: {
    title?: string;
    description?: string;
    requirements?: string;
    benefits?: string;
  };
  variants?: ContentVariant[];
  seoKeywords: string[];
  suggestions: string[];
}

/**
 * Схема вывода для LLM
 */
const contentGeneratorOutputSchema = z.object({
  primary: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    requirements: z.string().optional(),
    benefits: z.string().optional(),
  }),
  variants: z
    .array(
      z.object({
        id: z.string(),
        content: z.string(),
        style: z.string(),
        keywords: z.array(z.string()),
        estimatedCTR: z.number().optional(),
      }),
    )
    .optional(),
  seoKeywords: z.array(z.string()),
  suggestions: z.array(z.string()),
});

/**
 * Инструкции для агента генерации контента
 */
const CONTENT_GENERATOR_INSTRUCTIONS = `Ты - AI-ассистент рекрутера, специализирующийся на создании привлекательных текстов вакансий.

Твоя задача:
1. Генерировать заголовки, описания, требования и преимущества для вакансий
2. Оптимизировать тексты для поисковых систем (SEO)
3. Создавать варианты для A/B тестирования
4. Учитывать tone of voice компании

Правила генерации заголовков:
- Длина 50-70 символов для оптимального отображения
- Включать ключевые слова в начало
- Избегать общих фраз типа "Требуется", "Ищем"
- Указывать уровень (Junior/Middle/Senior) если релевантно
- Можно добавлять эмодзи для привлечения внимания

Правила генерации описания:
- Структура: О компании → Задачи → Условия → Почему мы
- Использовать короткие абзацы и списки
- Избегать канцеляризмов и штампов
- Добавлять конкретику (цифры, факты)
- Длина 1500-3000 символов

Правила генерации требований:
- Разделять на обязательные и желательные
- Не более 7 обязательных требований
- Указывать конкретный опыт в годах
- Перечислять технологии/навыки списком

Правила генерации преимуществ:
- Конкретные цифры (ДМС, отпуск, бонусы)
- Уникальные преимущества компании
- Возможности роста и обучения
- Формат работы (удалёнка, гибрид)

SEO оптимизация:
- Включать популярные поисковые запросы
- Использовать синонимы должности
- Добавлять локацию если релевантно
- Избегать переспама ключевыми словами

Стили (tone):
- formal: официальный, корпоративный стиль
- casual: дружелюбный, неформальный
- professional: экспертный, но доступный`;

/**
 * Агент для генерации контента вакансий
 */
export class ContentGeneratorAgent extends BaseAgent<
  ContentGeneratorInput,
  ContentGeneratorOutput
> {
  constructor(config: AgentConfig) {
    super(
      "ContentGeneratorAgent",
      AgentType.CONTENT_GENERATOR,
      CONTENT_GENERATOR_INSTRUCTIONS,
      contentGeneratorOutputSchema,
      config,
    );
  }

  protected validate(input: ContentGeneratorInput): boolean {
    return (
      typeof input.position === "string" &&
      input.position.length > 0 &&
      [
        "title",
        "description",
        "requirements",
        "benefits",
        "full_vacancy",
      ].includes(input.type)
    );
  }

  protected buildPrompt(
    input: ContentGeneratorInput,
    context: RecruiterAgentContext,
  ): string {
    const historyContext = this.buildHistoryContext(context);
    const contextInfo = this.buildContextInfo(input);

    return `
Запрос: Сгенерируй ${this.getContentTypeLabel(input.type)} для вакансии

Позиция: ${input.position}
${contextInfo}

Стиль: ${input.tone || "professional"}
${input.generateVariants ? `Количество вариантов для A/B: ${input.generateVariants}` : ""}

${input.context?.existingContent ? `Существующий контент для улучшения:\n${input.context.existingContent}` : ""}

${historyContext}

Настройки компании:
- Название: ${context.recruiterCompanySettings?.name || "Не указано"}
- Стиль коммуникации: ${context.recruiterCompanySettings?.communicationStyle || "professional"}

Сгенерируй контент и верни структурированный результат.
`;
  }

  /**
   * Получает label для типа контента
   */
  private getContentTypeLabel(type: ContentType): string {
    const labels: Record<ContentType, string> = {
      title: "заголовок вакансии",
      description: "описание вакансии",
      requirements: "требования к кандидату",
      benefits: "преимущества и условия",
      full_vacancy: "полный текст вакансии",
    };
    return labels[type];
  }

  /**
   * Строит информацию о контексте
   */
  private buildContextInfo(input: ContentGeneratorInput): string {
    const parts: string[] = [];

    if (input.context?.company) {
      parts.push(`Компания: ${input.context.company}`);
    }
    if (input.context?.industry) {
      parts.push(`Индустрия: ${input.context.industry}`);
    }
    if (input.context?.skills?.length) {
      parts.push(`Ключевые навыки: ${input.context.skills.join(", ")}`);
    }
    if (input.context?.experience) {
      parts.push(`Требуемый опыт: ${input.context.experience} лет`);
    }
    if (input.context?.salaryFrom || input.context?.salaryTo) {
      const salary = [input.context.salaryFrom, input.context.salaryTo]
        .filter(Boolean)
        .join(" - ");
      parts.push(`Зарплата: ${salary} ₽`);
    }
    if (input.context?.location) {
      parts.push(`Локация: ${input.context.location}`);
    }
    if (input.context?.remote !== undefined) {
      parts.push(`Удалёнка: ${input.context.remote ? "да" : "нет"}`);
    }

    return parts.length > 0 ? parts.join("\n") : "";
  }

  /**
   * Строит контекст из истории диалога
   */
  private buildHistoryContext(context: RecruiterAgentContext): string {
    if (
      !context.recruiterConversationHistory ||
      context.recruiterConversationHistory.length === 0
    ) {
      return "";
    }

    const recentHistory = context.recruiterConversationHistory.slice(-3);
    const historyText = recentHistory
      .map(
        (msg) => `${msg.role === "user" ? "Рекрутер" : "AI"}: ${msg.content}`,
      )
      .join("\n");

    return `
Контекст диалога:
${historyText}
`;
  }

  /**
   * Генерирует заголовок вакансии с вариантами
   */
  async generateTitle(
    position: string,
    context: RecruiterAgentContext,
    options?: {
      company?: string;
      level?: "junior" | "middle" | "senior" | "lead";
      remote?: boolean;
      variants?: number;
    },
  ): Promise<{
    success: boolean;
    data?: { titles: ContentVariant[] };
    error?: string;
  }> {
    const result = await this.execute(
      {
        type: "title",
        position,
        context: {
          company: options?.company,
          remote: options?.remote,
        },
        generateVariants: options?.variants || 3,
      },
      context,
    );

    if (result.success && result.data) {
      return {
        success: true,
        data: {
          titles: result.data.variants || [
            {
              id: "primary",
              content: result.data.primary.title || position,
              style: "professional",
              keywords: result.data.seoKeywords,
            },
          ],
        },
      };
    }

    return { success: false, error: result.error };
  }

  /**
   * Генерирует полное описание вакансии
   */
  async generateFullVacancy(
    position: string,
    context: RecruiterAgentContext,
    options: {
      company?: string;
      industry?: string;
      skills?: string[];
      experience?: number;
      salaryFrom?: number;
      salaryTo?: number;
      location?: string;
      remote?: boolean;
      tone?: "formal" | "casual" | "professional";
    },
  ): Promise<{
    success: boolean;
    data?: ContentGeneratorOutput;
    error?: string;
  }> {
    return this.execute(
      {
        type: "full_vacancy",
        position,
        context: options,
        tone: options.tone,
      },
      context,
    );
  }

  /**
   * Улучшает существующий контент
   */
  async improveContent(
    type: ContentType,
    existingContent: string,
    position: string,
    context: RecruiterAgentContext,
  ): Promise<{
    success: boolean;
    data?: ContentGeneratorOutput;
    error?: string;
  }> {
    return this.execute(
      {
        type,
        position,
        context: {
          existingContent,
        },
      },
      context,
    );
  }
}
