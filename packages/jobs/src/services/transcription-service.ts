import { openai } from "@ai-sdk/openai";
import { experimental_transcribe as transcribe } from "ai";

export async function transcribeAudio(
  audioBuffer: Buffer,
): Promise<string | null> {
  try {
    const result = await transcribe({
      model: openai.transcription("whisper-1"),
      audio: audioBuffer,
      providerOptions: { openai: { language: "ru" } },
    });

    return result.text;
  } catch (error) {
    console.error("Ошибка при транскрипции аудио:", error);
    return null;
  }
}
