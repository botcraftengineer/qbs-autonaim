import type { TelegramClient } from "@mtcute/bun";

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
