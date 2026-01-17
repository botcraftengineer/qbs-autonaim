/**
 * Базовый класс для агентов на основе AI SDK 6 ToolLoopAgent
 */

import type { LanguageModel, ToolSet } from "ai";
import { Output, stepCountIs, ToolLoopAgent } from "ai";
import type { Langfuse } from "langfuse";
import { type ZodType, z } from "zod";
import type { AgentType } from "./types";

/**
 * Envelope schema for AI responses
 * Wraps the actual content with metadata about the generation
 */
const aiResponseEnvelopeSchema = z.object({
  content: z.unknown(), // Will be validated against specific output schema
  metadata: z
    .object({
      tokens: z.number().optional(),
      model: z.string().optional(),
      finishReason: z.string().optional(),
      timestamp: z.string().optional(),
    })
    .optional(),
});

export interface AgentConfig {
  model: LanguageModel;
  maxSteps?: number;
  langfuse?: Langfuse | undefined;
  traceId?: string;
  tools?: ToolSet;
}

/**
 * Базовый класс для агентов с AI SDK 6 ToolLoopAgent
 */
export abstract class BaseAgent<TInput, TOutput> {
  protected readonly name: string;
  protected readonly type: AgentType;
  protected readonly agent: ToolLoopAgent;
  protected readonly langfuse?: Langfuse;
  protected readonly traceId?: string;
  protected readonly outputSchema: ZodType<TOutput>;

  constructor(
    name: string,
    type: AgentType,
    instructions: string,
    outputSchema: ZodType<TOutput>,
    config: AgentConfig,
  ) {
    this.name = name;
    this.type = type;
    this.langfuse = config.langfuse;
    this.traceId = config.traceId;
    this.outputSchema = outputSchema;

    this.agent = new ToolLoopAgent({
      model: config.model,
      instructions,
      tools: config.tools,
      output: Output.object({
        schema: outputSchema,
      }),
      stopWhen: stepCountIs(config.maxSteps || 25),
    });
  }

  protected abstract validate(input: TInput): boolean;
  protected abstract buildPrompt(input: TInput, context: unknown): string;

  async execute(
    input: TInput,
    context: unknown,
  ): Promise<{ success: boolean; data?: TOutput; error?: string }> {
    if (!this.validate(input)) {
      console.error(`[${this.name}] Validation failed for input:`, {
        inputKeys: Object.keys(input as object),
        inputSample: JSON.stringify(input).substring(0, 500),
      });
      return { success: false, error: "Некорректные входные данные" };
    }

    const span = this.langfuse?.span({
      traceId: this.traceId,
      name: this.name,
      input,
      metadata: {
        agentType: this.type,
      },
    });

    try {
      const prompt = this.buildPrompt(input, context);

      // Логируем длину промпта и его содержимое для отладки
      console.log(`[${this.name}] Executing agent:`, {
        promptLength: prompt.length,
        estimatedTokens: Math.ceil(prompt.length / 4),
        promptPreview:
          prompt.substring(0, 500) + (prompt.length > 500 ? "..." : ""),
      });

      // Логируем скомпилированный prompt в Langfuse
      span?.update({
        input: {
          rawInput: input,
          compiledPrompt: prompt,
        },
      });

      const result = await this.agent.generate({ prompt });

      // Validate envelope structure first
      const envelopeValidation = aiResponseEnvelopeSchema.safeParse({
        content: result.output,
        metadata: {
          model: result.model?.modelId,
          finishReason: result.finishReason,
          timestamp: new Date().toISOString(),
        },
      });

      if (!envelopeValidation.success) {
        console.error(`[${this.name}] Envelope validation failed:`, {
          errors: envelopeValidation.error.errors,
          rawOutput: result.output,
        });
        throw new Error(
          `Envelope validation failed: ${envelopeValidation.error.message}`,
        );
      }

      // Extract content from envelope and validate against output schema
      const envelope = envelopeValidation.data;

      const contentValidation = this.outputSchema.safeParse(envelope.content);

      if (!contentValidation.success) {
        console.error(`[${this.name}] Content validation failed:`, {
          errors: contentValidation.error.errors,
          content: envelope.content,
        });
        throw new Error(
          `Content validation failed: ${contentValidation.error.message}`,
        );
      }

      const validatedOutput = contentValidation.data;

      span?.end({
        output: validatedOutput,
        metadata: {
          success: true,
          promptLength: prompt.length,
          envelopeMetadata: envelope.metadata,
        },
      });

      return {
        success: true,
        data: validatedOutput,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      // Извлекаем детали ошибки API
      const apiError = error as {
        responseBody?: unknown;
        statusCode?: number;
        requestId?: string;
      };
      const responseBody = apiError?.responseBody;
      const statusCode = apiError?.statusCode;
      const requestId = apiError?.requestId;

      // Логируем детальную информацию об ошибке
      console.error(`[${this.name}] Agent execution failed:`, {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        agentType: this.type,
        // API детали
        statusCode,
        requestId,
        responseBody: responseBody ? JSON.stringify(responseBody) : undefined,
        // Добавляем детали ошибки для отладки
        errorDetails:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                cause: error.cause,
              }
            : error,
      });

      span?.end({
        output: { error: errorMessage },
        metadata: {
          success: false,
          error: errorMessage,
          errorStack: error instanceof Error ? error.stack : undefined,
          statusCode,
          responseBody,
        },
      });

      return {
        success: false,
        error: errorMessage,
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
