/**
 * Базовый агент с интеграцией AI SDK
 */

import { generateText } from "@qbs-autonaim/lib/ai";
import type { LanguageModel } from "ai";
import type { ZodSchema } from "zod";
import { BaseAgent } from "./base-agent";
import type { AgentType } from "./types";

export interface AIPoweredAgentConfig {
  model: LanguageModel;
  maxTokens?: number;
}

/**
 * Абстрактный класс агента с AI-возможностями
 */
export abstract class AIPoweredAgent<TInput, TOutput> extends BaseAgent<
  TInput,
  TOutput
> {
  protected model: LanguageModel;
  protected maxTokens: number;

  constructor(
    name: string,
    type: AgentType,
    systemPrompt: string,
    config: AIPoweredAgentConfig,
  ) {
    super(name, type, systemPrompt);
    this.model = config.model;
    this.maxTokens = config.maxTokens || 2000;
  }

  /**
   * Генерация текста с использованием AI
   */
  protected async generateAIResponse(
    prompt: string,
    // biome-ignore lint/suspicious/noExplicitAny: AI SDK tools требуют any
    tools?: Record<string, any>,
  ): Promise<string> {
    const result = await generateText({
      model: this.model,
      prompt,
      ...(tools && { tools }),
      generationName: `${this.name}-generation`,
    });

    return result.text;
  }

  /**
   * Парсинг JSON-ответа от AI
   */
  protected parseJSONResponse<T>(text: string): T | null {
    try {
      // Извлекаем JSON из markdown блоков если есть
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
        text.match(/```\s*([\s\S]*?)\s*```/) || [null, text];

      const jsonText = jsonMatch[1] || text;
      return JSON.parse(jsonText.trim()) as T;
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      return null;
    }
  }

  /**
   * Парсинг JSON с автоматическим исправлением через AI при ошибке
   */
  protected async parseJSONResponseWithRetry<T>(
    text: string,
    schema: ZodSchema<T>,
    expectedFormat: string,
    maxRetries = 2,
  ): Promise<T | null> {
    // Первая попытка парсинга
    const firstAttempt = this.parseJSONResponse<T>(text);
    if (firstAttempt) {
      const validation = schema.safeParse(firstAttempt);
      if (validation.success) {
        return validation.data;
      }
      console.error("Schema validation failed:", validation.error);
    }

    // Если не удалось, пробуем исправить через AI
    let currentText = text;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const fixPrompt = `Ты получил невалидный JSON. Исправь его и верни ТОЛЬКО валидный JSON без дополнительного текста.

НЕВАЛИДНЫЙ JSON:
${currentText}

ОЖИДАЕМЫЙ ФОРМАТ:
${expectedFormat}

ВАЖНО:
- Верни ТОЛЬКО исправленный JSON
- Не добавляй объяснений или комментариев
- Убедись, что JSON валиден
- Сохрани все поля из ожидаемого формата`;

        const fixedResponse = await this.generateAIResponse(fixPrompt);
        const parsed = this.parseJSONResponse<T>(fixedResponse);

        if (parsed) {
          const validation = schema.safeParse(parsed);
          if (validation.success) {
            console.log(`JSON исправлен на попытке ${attempt}`);
            return validation.data;
          }
          console.error(`Попытка ${attempt}: схема не прошла валидацию`, validation.error);
        }

        currentText = fixedResponse;
      } catch (error) {
        console.error(`Попытка исправления ${attempt} не удалась:`, error);
      }
    }

    return null;
  }
}
