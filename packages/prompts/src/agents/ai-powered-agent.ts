/**
 * Базовый агент с интеграцией AI SDK
 */

import type { LanguageModel } from "ai";
import { generateText } from "ai";
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
      maxOutputTokens: this.maxTokens,
      ...(tools && { tools }),
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
}
