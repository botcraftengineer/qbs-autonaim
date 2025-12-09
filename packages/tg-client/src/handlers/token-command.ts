import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";
import { linkConversationByToken } from "../utils/candidate-identifier.js";
import { humanDelay } from "../utils/delays.js";
import { markRead, showTyping } from "../utils/telegram.js";

/**
 * Обработчик команды /token для связывания беседы с откликом
 * Использование: /token <32-символьный токен>
 */
export async function handleTokenCommand(
  client: TelegramClient,
  message: Message,
): Promise<void> {
  const chatId = message.chat.id.toString();
  const messageText = message.text || "";
  const token = messageText.replace("/token", "").trim();

  await markRead(client, message.chat.id);

  if (!token || token.length !== 32) {
    await showTyping(client, message.chat.id);
    await humanDelay(800, 1500);

    await client.sendText(
      message.chat.id,
      "Хм, кажется, что-то не так с кодом 🤔\n\n" +
        "Попробуйте перейти по ссылке из моего сообщения в HH.ru — так будет проще. Или напишите мне название вакансии, на которую откликались, и я попробую найти вашу заявку вручную.",
    );
    return;
  }

  await showTyping(client, message.chat.id);
  await humanDelay(1000, 2000);

  const result = await linkConversationByToken(chatId, token);

  if (result.identified) {
    await client.sendText(
      message.chat.id,
      "Отлично, нашел! 👍\n\n" + "Теперь можем продолжить. Чем могу помочь?",
    );
  } else {
    await humanDelay(500, 1000);
    await client.sendText(
      message.chat.id,
      "Странно, не могу найти заявку по этому коду 🤷‍♂️\n\n" +
        "Давайте попробуем по-другому: напишите, пожалуйста, на какую вакансию вы откликались? Я поищу вручную.",
    );
  }
}
