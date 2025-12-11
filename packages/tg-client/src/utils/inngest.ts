import { env } from "@qbs-autonaim/config";

/**
 * Отправить событие транскрибации в Inngest
 */
export async function triggerTranscription(
  messageId: string,
  fileId: string,
): Promise<void> {
  if (!env.INNGEST_EVENT_KEY) {
    console.warn("⚠️ INNGEST_EVENT_KEY не установлен, событие не отправлено");
    return;
  }

  await fetch(`${env.INNGEST_EVENT_API_BASE_URL}/e/${env.INNGEST_EVENT_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "telegram/voice.transcribe",
      data: {
        messageId,
        fileId,
      },
    }),
  });
}

/**
 * Отправить событие отправки сообщения в Inngest
 */
export async function triggerMessageSend(
  messageId: string,
  chatId: string,
  content: string,
): Promise<void> {
  if (!env.INNGEST_EVENT_KEY) {
    console.warn("⚠️ INNGEST_EVENT_KEY не установлен, событие не отправлено");
    return;
  }

  await fetch(`${env.INNGEST_EVENT_API_BASE_URL}/e/${env.INNGEST_EVENT_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "telegram/message.send",
      data: {
        messageId,
        chatId,
        content,
      },
    }),
  });
}
