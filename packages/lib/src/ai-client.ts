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
 * Клонирует async iterable stream в два независимых потока,
 * сохраняя совместимость с AsyncIterableStream
 */
function teeAsyncIterableStream<T>(
  source: AsyncIterable<T> & ReadableStream<T>,
): [
  AsyncIterable<T> & ReadableStream<T>,
  AsyncIterable<T> & ReadableStream<T>,
] {
  const readers: Array<Array<T>> = [[], []];
  const promises: Array<Promise<IteratorResult<T>> | null> = [null, null];
  let sourceIterator: AsyncIterator<T> | null = null;
  let sourceDone = false;

  async function read() {
    if (!sourceIterator) {
      sourceIterator = source[Symbol.asyncIterator]();
    }
    return await sourceIterator.next();
  }

  function makeIterator(index: 0 | 1): AsyncIterator<T> {
    return {
      async next(): Promise<IteratorResult<T>> {
        const reader = readers[index];
        const otherIndex = index === 0 ? 1 : 0;
        const otherReader = readers[otherIndex];
        const otherPromiseSlot = promises[otherIndex];

        // Если есть буферизованные данные, вернуть их
        if (reader && reader.length > 0) {
          const value = reader.shift();
          if (value !== undefined) {
            return { value, done: false };
          }
        }

        // Если источник завершен, вернуть done
        if (sourceDone) {
          return { value: undefined as unknown as T, done: true };
        }

        // Если другой итератор уже читает, подождать его результат
        if (otherPromiseSlot !== null && otherPromiseSlot !== undefined) {
          const result = await otherPromiseSlot;
          promises[otherIndex] = null;

          if (result?.done) {
            sourceDone = true;
            return { value: undefined as unknown as T, done: true };
          }

          // Сохранить значение для текущего итератора
          if (result) {
            return { value: result.value, done: false };
          }
        }

        // Читать из источника
        const readPromise = read();
        promises[index] = readPromise;
        const result = await readPromise;
        promises[index] = null;

        if (result.done) {
          sourceDone = true;
          return { value: undefined as unknown as T, done: true };
        }

        // Сохранить значение для другого итератора
        otherReader?.push(result.value);

        return { value: result.value, done: false };
      },
    };
  }

  // Создаем объекты, которые копируют все свойства источника
  const stream1 = Object.create(
    Object.getPrototypeOf(source),
  ) as AsyncIterable<T> & ReadableStream<T>;
  const stream2 = Object.create(
    Object.getPrototypeOf(source),
  ) as AsyncIterable<T> & ReadableStream<T>;

  // Копируем все свойства источника
  for (const key of Object.keys(source)) {
    (stream1 as unknown as Record<string, unknown>)[key] = (
      source as unknown as Record<string, unknown>
    )[key];
    (stream2 as unknown as Record<string, unknown>)[key] = (
      source as unknown as Record<string, unknown>
    )[key];
  }

  // Переопределяем Symbol.asyncIterator
  (stream1 as unknown as Record<symbol, unknown>)[Symbol.asyncIterator] = () =>
    makeIterator(0);
  (stream2 as unknown as Record<symbol, unknown>)[Symbol.asyncIterator] = () =>
    makeIterator(1);

  return [stream1, stream2];
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

  let streamStarted = false;

  try {
    const result = aiStreamText({
      model,
      prompt,
    });

    // Разделяем поток на два независимых клона
    const [loggingStream, callerStream] = teeAsyncIterableStream(
      result.textStream,
    );

    // Собираем текст из клона для логирования
    (async () => {
      try {
        let fullText = "";
        for await (const chunk of loggingStream) {
          streamStarted = true;
          fullText += chunk;
        }

        generation.end({
          output: fullText,
        });

        trace.update({
          output: fullText,
        });

        await langfuse.flushAsync();
      } catch (streamError) {
        // Если стрим уже начался, не пытаемся переключиться на fallback
        if (streamStarted) {
          console.error("Ошибка во время стриминга (стрим уже начался):", {
            generationName,
            error:
              streamError instanceof Error
                ? streamError.message
                : String(streamError),
          });

          generation.end({
            statusMessage:
              streamError instanceof Error
                ? streamError.message
                : String(streamError),
          });

          trace.update({
            output: "Stream interrupted",
          });

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

          throw streamError;
        }

        // Если стрим ещё не начался, пробуем fallback
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
            `Ошибка ${actualProvider} до начала стрима, повторная попытка с ${fallbackProvider}:`,
            streamError instanceof Error
              ? streamError.message
              : String(streamError),
          );

          generation.end({
            statusMessage:
              streamError instanceof Error
                ? streamError.message
                : String(streamError),
            metadata: { ...metadata, retryAttempted: true },
          });

          const fallbackGeneration = trace.generation({
            name: `${generationName}-fallback`,
            model: fallbackModelName,
            input: prompt,
            metadata: { ...metadata, fallback: true },
          });

          try {
            const fallbackResult = aiStreamText({
              model: fallbackModel,
              prompt,
            });

            // Разделяем fallback поток на два независимых клона
            const [fallbackLoggingStream, fallbackCallerStream] =
              teeAsyncIterableStream(fallbackResult.textStream);

            // Собираем текст из клона для логирования
            (async () => {
              try {
                let fullText = "";
                for await (const chunk of fallbackLoggingStream) {
                  fullText += chunk;
                }

                fallbackGeneration.end({
                  output: fullText,
                });

                trace.update({
                  output: fullText,
                });

                await langfuse.flushAsync();
              } catch (fallbackFlushError) {
                console.error(
                  "Не удалось сохранить трейс Langfuse для fallback",
                  {
                    generationName,
                    traceId: trace.id,
                    entityId,
                    error: fallbackFlushError,
                  },
                );
              }
            })();

            // Возвращаем fallback результат с нетронутым потоком для вызывающего кода
            return {
              ...fallbackResult,
              textStream: fallbackCallerStream,
            };
          } catch (fallbackError) {
            fallbackGeneration.end({
              statusMessage:
                fallbackError instanceof Error
                  ? fallbackError.message
                  : String(fallbackError),
            });

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

            throw fallbackError;
          }
        }

        // Если fallback недоступен, просто пробрасываем ошибку
        generation.end({
          statusMessage:
            streamError instanceof Error
              ? streamError.message
              : String(streamError),
        });

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

        throw streamError;
      }
    })();

    // Возвращаем результат с нетронутым потоком для вызывающего кода
    return {
      ...result,
      textStream: callerStream,
    };
  } catch (error) {
    // Синхронная ошибка при создании стрима (до начала итерации)
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
        `Ошибка ${actualProvider} при создании стрима, повторная попытка с ${fallbackProvider}:`,
        error instanceof Error ? error.message : String(error),
      );

      const fallbackGeneration = trace.generation({
        name: `${generationName}-fallback`,
        model: fallbackModelName,
        input: prompt,
        metadata: { ...metadata, fallback: true },
      });

      try {
        const fallbackResult = aiStreamText({
          model: fallbackModel,
          prompt,
        });

        // Разделяем fallback поток на два независимых клона
        const [fallbackLoggingStream, fallbackCallerStream] =
          teeAsyncIterableStream(fallbackResult.textStream);

        // Собираем текст из клона для логирования
        (async () => {
          try {
            let fullText = "";
            for await (const chunk of fallbackLoggingStream) {
              fullText += chunk;
            }

            fallbackGeneration.end({
              output: fullText,
            });

            trace.update({
              output: fullText,
            });

            await langfuse.flushAsync();
          } catch (flushError) {
            console.error("Не удалось сохранить трейс Langfuse для fallback", {
              generationName,
              traceId: trace.id,
              entityId,
              error: flushError,
            });
          }
        })();

        // Возвращаем fallback результат с нетронутым потоком для вызывающего кода
        return {
          ...fallbackResult,
          textStream: fallbackCallerStream,
        };
      } catch (fallbackError) {
        fallbackGeneration.end({
          statusMessage:
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError),
        });

        try {
          langfuse.flushAsync().catch((flushError) => {
            console.error("Не удалось сохранить трейс Langfuse", {
              generationName,
              traceId: trace.id,
              entityId,
              error: flushError,
            });
          });
        } catch {
          // Игнорируем ошибки flush
        }

        throw fallbackError;
      }
    }

    try {
      langfuse.flushAsync().catch((flushError) => {
        console.error("Не удалось сохранить трейс Langfuse", {
          generationName,
          traceId: trace.id,
          entityId,
          error: flushError,
        });
      });
    } catch {
      // Игнорируем ошибки flush
    }

    throw error;
  }
}
