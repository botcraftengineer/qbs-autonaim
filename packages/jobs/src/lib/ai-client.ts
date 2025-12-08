import { deepseek } from "@ai-sdk/deepseek";
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

interface GenerateTextOptions {
  model?: LanguageModel;
  prompt: string;
  temperature?: number;
  generationName: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function generateText(options: GenerateTextOptions) {
  const {
    model = deepseek("deepseek-chat"),
    prompt,
    temperature = 0.3,
    generationName,
    entityId,
    metadata = {},
  } = options;

  const trace = langfuse.trace({
    name: generationName,
    userId: entityId,
    metadata,
  });

  const generation = trace.generation({
    name: generationName,
    model: "deepseek-chat",
    input: prompt,
    metadata,
  });

  try {
    const result = await aiGenerateText({
      model,
      prompt,
      temperature,
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
  temperature?: number;
  generationName: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function generateObject<T extends z.ZodType>(
  options: GenerateObjectOptions<T>,
) {
  const {
    model = deepseek("deepseek-chat"),
    schema,
    prompt,
    temperature = 0.3,
    generationName,
    entityId,
    metadata = {},
  } = options;

  const trace = langfuse.trace({
    name: generationName,
    userId: entityId,
    metadata,
  });

  const generation = trace.generation({
    name: generationName,
    model: "deepseek-chat",
    input: prompt,
    metadata,
  });

  try {
    const result = await aiGenerateObject({
      model,
      schema,
      prompt,
      temperature,
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
