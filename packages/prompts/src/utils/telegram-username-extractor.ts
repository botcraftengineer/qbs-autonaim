import { generateObject } from "@selectio/jobs/lib/ai-client";
import { z } from "zod";

const TelegramUsernameSchema = z.object({
  username: z
    .string()
    .nullable()
    .describe("Telegram username без @, или null если не найден"),
});

/**
 * Извлекает Telegram username из контактных данных с помощью DeepSeek
 */
export async function extractTelegramUsername(
  contacts: unknown,
): Promise<string | null> {
  if (!contacts) {
    return null;
  }

  try {
    const contactsStr =
      typeof contacts === "string"
        ? contacts
        : JSON.stringify(contacts, null, 2);

    const { object } = await generateObject({
      schema: TelegramUsernameSchema,
      prompt: `Извлеки Telegram username из контактных данных. 
      
Контакты:
${contactsStr}

Найди username Telegram (обычно начинается с @ или указан как telegram/tg). 
Верни username БЕЗ символа @.
Если username не найден, верни null.`,
      generationName: "extract-telegram-username",
    });

    return object.username;
  } catch (error) {
    console.log("⚠️ Ошибка извлечения Telegram username");
    if (error instanceof Error) {
      console.log(`   ${error.message}`);
    }
    return null;
  }
}
