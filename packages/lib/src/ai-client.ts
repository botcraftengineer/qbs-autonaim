import { deepseek } from "@ai-sdk/deepseek";
import { openai } from "@ai-sdk/openai";
import { env } from "@qbs-autonaim/config";
import type { LanguageModel } from "ai";
import {
  generateObject as aiGenerateObject,
  generateText as aiGenerateText,
} from "ai";
import { Langfuse } from "langfuse";
import type { z } from "zod";

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
});

const DEFAULT_MODEL_OPENAI = "gpt-4o-mini";
const DEFAULT_MODEL_DEEPSEEK = "deepseek-chat";

/**
 * Получить модель AI на основе конфигурации окружения с fallback
 */
export function getAIModel(): LanguageModel {
  const provider = env.AI_PROVIDER;

  switch (provider) {
    case "openai": {
      const model = env.AI_MODEL || DEFAULT_MODEL_OPENAI;
      if (!env.OPENAI_API_KEY) {
        console.warn(
          "OPENAI_API_KEY не установлен. Переключаюсь на DeepSeek как fallback.",
        );
        // Fallback на DeepSeek
        if (!env.DEEPSEEK_API_KEY) {
          throw new Error(
            "Ни OPENAI_API_KEY, ни DEEPSEEK_API_KEY не установлены. Добавьте хотя бы один в .env файл.",
          );
        }
        return deepseek(DEFAULT_MODEL_DEEPSEEK);
      }
      return openai(model);
    }
    case "deepseek": {
      const model = env.AI_MODEL || DEFAULT_MODEL_DEEPSEEK;
      if (!env.DEEPSEEK_API_KEY) {
        console.warn(
          "DEEPSEEK_API_KEY не установлен. Переключаюсь на OpenAI как fallback.",
        );
        // Fallback на OpenAI
        if (!env.OPENAI_API_KEY) {
          throw new Error(
            "Ни DEEPSEEK_API_KEY, ни OPENAI_API_KEY не установлены. Добавьте хотя бы один в .env файл.",
          );
        }
        return openai(DEFAULT_MODEL_OPENAI);
      }
      return deepseek(model);
    }
    default:
      throw new Error(`Неподдерживаемый AI провайдер: ${provider}`);
  }
}

/**
 * Получить название модели для логирования
 */
export function getAIModelName(): string {
  const provider = env.AI_PROVIDER;
  const customModel = env.AI_MODEL;

  if (customModel) {
    return customModel;
  }

  return provider === "openai" ? DEFAULT_MODEL_OPENAI : DEFAULT_MODEL_DEEPSEEK;
}

interface GenerateTextOptions {
  model?: LanguageModel;
  prompt: string;
  generationName: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function generateText(
  options: GenerateTextOptions,
): Promise<Awaited<ReturnType<typeof aiGenerateText>>> {
  const {
    model = getAIModel(),
    prompt,
    generationName,
    entityId,
    metadata = {},
  } = options;

  const modelName = getAIModelName();

  const trace = langfuse.trace({
    name: generationName,
    userId: entityId,
    metadata,
  });

  const generation = trace.generation({
    name: generationName,
    model: modelName,
    input: prompt,
    metadata,
  });

  try {
    const result = await aiGenerateText({
      model,
      prompt,
    });

    generation.end({
      output: result.text,
    });

    trace.update({
      output: result.text,
    });

    return result;
  } catch (error) {
    generation.end({
      statusMessage: error instanceof Error ? error.message : String(error),
    });

    // Retry с fallback моделью если основная модель OpenAI
    if (env.AI_PROVIDER === "openai" && env.DEEPSEEK_API_KEY) {
      console.warn(
        "Ошибка OpenAI, повторная попытка с DeepSeek:",
        error instanceof Error ? error.message : String(error),
      );

      const fallbackModel = deepseek(DEFAULT_MODEL_DEEPSEEK);
      const fallbackGeneration = trace.generation({
        name: `${generationName}-fallback`,
        model: DEFAULT_MODEL_DEEPSEEK,
        input: prompt,
        metadata: { ...metadata, fallback: true },
      });

      try {
        const fallbackResult = await aiGenerateText({
          model: fallbackModel,
          prompt,
        });

        fallbackGeneration.end({
          output: fallbackResult.text,
        });

        return fallbackResult;
      } catch (fallbackError) {
        fallbackGeneration.end({
          statusMessage:
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError),
        });
        throw fallbackError;
      }
    }

    throw error;
  } finally {
    try {
      await langfuse.flushAsync();
    } catch (flushError) {
      console.error("Не удалось сохранить трейс Langfuse", {
        generationName,
        traceId: trace.id,
        entityId,
        error: flushError,
      });
    }
  }
}

interface GenerateObjectOptions<T extends z.ZodType> {
  model?: LanguageModel;
  schema: T;
  prompt: string;
  generationName: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function generateObject<T extends z.ZodType>(
  options: GenerateObjectOptions<T>,
): Promise<Awaited<ReturnType<typeof aiGenerateObject<T>>>> {
  const {
    model = getAIModel(),
    schema,
    prompt,
    generationName,
    entityId,
    metadata = {},
  } = options;

  const modelName = getAIModelName();

  const trace = langfuse.trace({
    name: generationName,
    userId: entityId,
    metadata,
  });

  const generation = trace.generation({
    name: generationName,
    model: modelName,
    input: prompt,
    metadata,
  });

  try {
    const result = await aiGenerateObject({
      model,
      schema,
      prompt,
    });

    generation.end({
      output: result.object,
    });

    trace.update({
      output: result.object,
    });

    return result;
  } catch (error) {
    generation.end({
      statusMessage: error instanceof Error ? error.message : String(error),
    });

    // Retry с fallback моделью если основная модель OpenAI
    if (env.AI_PROVIDER === "openai" && env.DEEPSEEK_API_KEY) {
      console.warn(
        "Ошибка OpenAI, повторная попытка с DeepSeek:",
        error instanceof Error ? error.message : String(error),
      );

      const fallbackModel = deepseek(DEFAULT_MODEL_DEEPSEEK);
      const fallbackGeneration = trace.generation({
        name: `${generationName}-fallback`,
        model: DEFAULT_MODEL_DEEPSEEK,
        input: prompt,
        metadata: { ...metadata, fallback: true },
      });

      try {
        const fallbackResult = await aiGenerateObject({
          model: fallbackModel,
          schema,
          prompt,
        });

        fallbackGeneration.end({
          output: fallbackResult.object,
        });

        return fallbackResult;
      } catch (fallbackError) {
        fallbackGeneration.end({
          statusMessage:
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError),
        });
        throw fallbackError;
      }
    }

    throw error;
  } finally {
    try {
      await langfuse.flushAsync();
    } catch (flushError) {
      console.error("Не удалось сохранить трейс Langfuse", {
        generationName,
        traceId: trace.id,
        entityId,
        error: flushError,
      });
    }
  }
}
