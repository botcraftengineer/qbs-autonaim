import { randomBytes } from "node:crypto";
import { eq } from "@selectio/db";
import { db } from "@selectio/db/client";
import { vacancyResponse } from "@selectio/db/schema";
import { createLogger, err, ok, type Result, tryCatch } from "../base";

const logger = createLogger("TelegramInvite");

interface GenerateInviteParams {
  responseId: string;
  botUsername: string;
}

/**
 * Generate unique invite token for candidate and create Telegram bot link
 */
export async function generateTelegramInvite(
  params: GenerateInviteParams,
): Promise<Result<string>> {
  const { responseId, botUsername } = params;

  logger.info("Generating Telegram invite", { responseId });

  // Check if token already exists
  const existingResponse = await tryCatch(async () => {
    return await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, responseId),
    });
  }, "Failed to fetch response");

  if (!existingResponse.success) {
    return err(existingResponse.error);
  }

  if (!existingResponse.data) {
    return err("Response not found");
  }

  // If token exists, reuse it
  if (existingResponse.data.telegramInviteToken) {
    const inviteLink = `https://t.me/${botUsername}?start=${existingResponse.data.telegramInviteToken}`;
    logger.info("Reusing existing invite token", { responseId, inviteLink });
    return ok(inviteLink);
  }

  // Generate new unique token
  const token = randomBytes(16).toString("hex");

  // Save token to database
  const updateResult = await tryCatch(async () => {
    await db
      .update(vacancyResponse)
      .set({ telegramInviteToken: token })
      .where(eq(vacancyResponse.id, responseId));
  }, "Failed to save invite token");

  if (!updateResult.success) {
    return err(updateResult.error);
  }

  const inviteLink = `https://t.me/${botUsername}?start=${token}`;
  logger.info("Generated new invite token", { responseId, inviteLink });

  return ok(inviteLink);
}

/**
 * Find response by invite token
 */
export async function findResponseByInviteToken(
  token: string,
): Promise<Result<{ id: string; candidateName: string | null }>> {
  logger.info("Looking up response by invite token", { token });

  const result = await tryCatch(async () => {
    return await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.telegramInviteToken, token),
    });
  }, "Failed to find response by token");

  if (!result.success) {
    return err(result.error);
  }

  if (!result.data) {
    return err("Invalid or expired invite token");
  }

  return ok({
    id: result.data.id,
    candidateName: result.data.candidateName,
  });
}
