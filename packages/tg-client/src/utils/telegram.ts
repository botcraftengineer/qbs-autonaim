import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";

/**
 * Получить историю сообщений из чата
 */
export async function getChatHistory(
  client: TelegramClient,
  chatId: number,
  limit = 20,
): Promise<
  Array<{
    sender: "CANDIDATE" | "BOT";
    content: string;
    contentType?: "TEXT" | "VOICE";
  }>
> {
  try {
    const messages: Message[] = [];

    for await (const msg of client.iterHistory(chatId, { limit })) {
      messages.push(msg);
    }

    // Получаем ID бота для определения отправителя
    const me = await client.getMe();
    const botId = me.id;

    return messages
      .reverse()
      .filter((msg) => msg.text || (msg.media && msg.media.type === "voice"))
      .map((msg) => ({
        sender: msg.sender?.id === botId ? "BOT" : "CANDIDATE",
        content:
          msg.media && msg.media.type === "voice"
            ? "Голосовое сообщение"
            : msg.text || "",
        contentType:
          msg.media && msg.media.type === "voice"
            ? ("VOICE" as const)
            : ("TEXT" as const),
      }));
  } catch (error) {
    console.error("Ошибка при получении истории чата:", error);
    return [];
  }
}

/**
 * Отметить сообщения как прочитанные
 */
export async function markRead(
  client: TelegramClient,
  chatId: number,
): Promise<void> {
  try {
    await client.call({
      _: "messages.readHistory",
      peer: await client.resolvePeer(chatId),
      maxId: 0,
    });
  } catch (error) {
    console.error("Ошибка при отметке сообщений как прочитанных:", error);
  }
}

/**
 * Показать индикатор печати
 */
export async function showTyping(
  client: TelegramClient,
  chatId: number,
): Promise<void> {
  await client.call({
    _: "messages.setTyping",
    peer: await client.resolvePeer(chatId),
    action: { _: "sendMessageTypingAction" },
  });
}

/**
 * Показать индикатор записи аудио
 */
export async function showRecordingAudio(
  client: TelegramClient,
  chatId: number,
): Promise<void> {
  await client.call({
    _: "messages.setTyping",
    peer: await client.resolvePeer(chatId),
    action: { _: "sendMessageRecordAudioAction" },
  });
}
