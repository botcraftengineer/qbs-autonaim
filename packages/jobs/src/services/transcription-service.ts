import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@selectio/config";
import { experimental_transcribe as transcribe } from "ai";

export async function transcribeAudio(
  audioBuffer: Buffer,
): Promise<string | null> {
  if (!env.OPENAI_API_KEY) {
    console.log("⏭️ Транскрибация пропущена: OPENAI_API_KEY не заполнен");
    return null;
  }

  try {
    // Используем наш прокси-сервис
    const proxyBaseUrl = env.APP_URL || "http://localhost:3000";
    const openaiProvider = createOpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: `${proxyBaseUrl}/api/ai-proxy`,
    });

    const result = await transcribe({
      model: openaiProvider.transcription("whisper-1"),
      audio: audioBuffer,
      providerOptions: { openai: { language: "ru" } },
    });

    return result.text;
  } catch (error) {
    console.error("Ошибка при транскрибции аудио:", error);
    return null;
  }
}
