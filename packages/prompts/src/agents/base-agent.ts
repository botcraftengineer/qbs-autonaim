/**
 * Базовый класс для всех агентов
 */

import type { AgentResult, AgentType, BaseAgentContext } from "./types";

export abstract class BaseAgent<TInput, TOutput> {
  protected readonly name: string;
  protected readonly type: AgentType;
  protected readonly systemPrompt: string;

  constructor(name: string, type: AgentType, systemPrompt: string) {
    this.name = name;
    this.type = type;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Основной метод выполнения агента
   */
  abstract execute(
    input: TInput,
    context: BaseAgentContext,
  ): Promise<AgentResult<TOutput>>;

  /**
   * Валидация входных данных
   */
  protected abstract validate(input: TInput): boolean;

  /**
   * Построение промпта для агента
   */
  protected abstract buildPrompt(
    input: TInput,
    context: BaseAgentContext,
  ): string;

  /**
   * Получение метаданных агента
   */
  getMetadata(): { name: string; type: AgentType } {
    return {
      name: this.name,
      type: this.type,
    };
  }
}
