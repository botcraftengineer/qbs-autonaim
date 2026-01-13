import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@qbs-autonaim/config";
import { experimental_transcribe as transcribe } from "ai";
import { createLogger, ok, type Result, tryCatch } from "../base";

const logger = createLogger("Transcription");

/**
 * Transcribes audio buffer to text using OpenAI Whisper
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
): Promise<Result<string | null>> {
  if (!env.OPENAI_API_KEY) {
    logger.info("Transcription skipped: OPENAI_API_KEY not set");
    return ok(null);
  }

  return tryCatch(async () => {
    // Use proxy service
    const proxyBaseUrl =
      env.AI_PROXY_URL || env.APP_URL || "http://localhost:3000";
    const openaiProvider = createOpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: `${proxyBaseUrl}`,
    });
    const result = await transcribe({
      model: openaiProvider.transcription("whisper-1"),
      audio: audioBuffer,
      providerOptions: { openai: { language: "ru" } },
    });

    logger.info("Audio transcribed successfully");
    return result.text;
  }, "Failed to transcribe audio");
}
