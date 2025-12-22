/**
 * Базовый класс для агентов на основе AI SDK 6 ToolLoopAgent
 */

import type { LanguageModel } from "ai";
import { Output, stepCountIs, ToolLoopAgent } from "ai";
import type { ZodType } from "zod";
import type { AgentType } from "./types";

export interface AgentConfig {
  model: LanguageModel;
  maxSteps?: number;
}

/**
 * Базовый класс для агентов с AI SDK 6 ToolLoopAgent
 */
export abstract class BaseAgent<TInput, TOutput> {
  protected readonly name: string;
  protected readonly type: AgentType;
  protected readonly agent: ToolLoopAgent;

  constructor(
    name: string,
    type: AgentType,
    instructions: string,
    outputSchema: ZodType<TOutput>,
    config: AgentConfig,
  ) {
    this.name = name;
    this.type = type;

    this.agent = new ToolLoopAgent({
      model: config.model,
      instructions,
      output: Output.object({
        schema: outputSchema,
      }),
      stopWhen: stepCountIs(config.maxSteps || 10),
    });
  }

  protected abstract validate(input: TInput): boolean;
  protected abstract buildPrompt(input: TInput, context: unknown): string;

  async execute(
    input: TInput,
    context: unknown,
  ): Promise<{ success: boolean; data?: TOutput; error?: string }> {
    if (!this.validate(input)) {
      return { success: false, error: "Некорректные входные данные" };
    }

    try {
      const prompt = this.buildPrompt(input, context);
      const result = await this.agent.generate({ prompt });

      return {
        success: true,
        data: result.output as TOutput,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  }

  getMetadata(): { name: string; type: AgentType } {
    return {
      name: this.name,
      type: this.type,
    };
  }
}
