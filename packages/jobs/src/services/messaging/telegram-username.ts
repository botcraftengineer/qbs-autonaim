import { buildTelegramUsernameExtractionPrompt } from "@qbs-autonaim/prompts";
import { generateText } from "../../lib/ai-client";
import { AI, createLogger, TELEGRAM } from "../base";

const logger = createLogger("TelegramUsername");

/**
 * Extract Telegram username from contacts data using AI
 * @param contacts - Raw contacts data from HH.ru API
 * @returns Telegram username without @ or null if not found
 */
export async function extractTelegramUsername(
  contacts: unknown,
): Promise<string | null> {
  if (!contacts) {
    return null;
  }

  try {
    const contactsJson = JSON.stringify(contacts, null, 2);

    const prompt = buildTelegramUsernameExtractionPrompt(contactsJson);

    const { text } = await generateText({
      prompt,
      temperature: AI.TEMPERATURE_DETERMINISTIC,
      generationName: "extract-telegram-username",
      metadata: {
        contactsPreview: contactsJson.substring(0, 200),
      },
    });

    const cleanedText = text.trim();

    // Check if the response is null or empty
    if (
      cleanedText === "null" ||
      cleanedText === "" ||
      cleanedText.toLowerCase() === "none"
    ) {
      return null;
    }

    // Validate the username format
    if (!TELEGRAM.USERNAME_PATTERN.test(cleanedText)) {
      logger.warn("Invalid Telegram username format detected, ignoring");
      return null;
    }

    logger.info("Telegram username extracted successfully");
    return cleanedText;
  } catch (error) {
    logger.error("Error extracting Telegram username", { error });
    return null;
  }
}
