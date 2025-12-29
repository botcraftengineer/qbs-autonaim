import { deepseek } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@qbs-autonaim/config";
import type { LanguageModel } from "ai";
import { generateText as aiGenerateText, streamText as aiStreamText } from "ai";
import { Langfuse } from "langfuse";

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
});

const DEFAULT_MODEL_OPENAI = "gpt-5.2";
const DEFAULT_MODEL_DEEPSEEK = "deepseek-chat";

// Создаём OpenAI провайдер с прокси
const proxyBaseUrl = env.AI_PROXY_URL || env.APP_URL || "http://localhost:3000";
const openaiProvider = createOpenAI({
  apiKey: env.OPENAI_API_KEY || "dummy-key",
  baseURL: `${proxyBaseUrl}/api/ai-proxy`,
});

/**
 * Определить фактически используемый провайдер с учётом fallback
 */
function getActualProvider(): "openai" | "deepseek" {
  const provider = env.AI_PROVIDER;
  if (provider === "openai" && !env.OPENAI_API_KEY && env.DEEPSEEK_API_KEY) {
    return "deepseek";
  }
  if (provider === "deepseek" && !env.DEEPSEEK_API_KEY && env.OPENAI_API_KEY) {
    return "openai";
  }
  return provider;
}

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
      return openaiProvider(model);
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
        return openaiProvider(DEFAULT_MODEL_OPENAI);
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

    // Retry с fallback моделью
    const actualProvider = getActualProvider();
    const canFallback =
      (actualProvider === "openai" && env.DEEPSEEK_API_KEY) ||
      (actualProvider === "deepseek" && env.OPENAI_API_KEY);

    if (canFallback) {
      const fallbackProvider =
        actualProvider === "openai" ? "deepseek" : "openai";
      const fallbackModel =
        fallbackProvider === "deepseek"
          ? deepseek(DEFAULT_MODEL_DEEPSEEK)
          : openaiProvider(DEFAULT_MODEL_OPENAI);
      const fallbackModelName =
        fallbackProvider === "deepseek"
          ? DEFAULT_MODEL_DEEPSEEK
          : DEFAULT_MODEL_OPENAI;

      console.warn(
        `Ошибка ${actualProvider}, повторная попытка с ${fallbackProvider}:`,
        error instanceof Error ? error.message : String(error),
      );

      const fallbackGeneration = trace.generation({
        name: `${generationName}-fallback`,
        model: fallbackModelName,
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

interface StreamTextOptions {
  model?: LanguageModel;
  prompt: string;
  generationName: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export function streamText(
  options: StreamTextOptions,
): ReturnType<typeof aiStreamText> {
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
    const result = aiStreamText({
      model,
      prompt,
    });

    // Собираем текст из стрима для логирования
    (async () => {
      try {
        let fullText = "";
        for await (const chunk of result.textStream) {
          fullText += chunk;
        }

        generation.end({
          output: fullText,
        });

        trace.update({
          output: fullText,
        });

        await langfuse.flushAsync();
      } catch (flushError) {
        console.error("Не удалось сохранить трейс Langfuse", {
          generationName,
          traceId: trace.id,
          entityId,
          error: flushError,
        });
      }
    })();

    return result;
  } catch (error) {
    generation.end({
      statusMessage: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}
