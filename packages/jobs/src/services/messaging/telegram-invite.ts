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
 * Validate Telegram username format
 * Username must contain only latin letters, digits, underscores, dots, and hyphens
 * Must be at least 5 characters long
 */
function isValidTelegramUsername(username: string): boolean {
  if (!username || username.length < 5) {
    return false;
  }
  // Telegram username: only a-z, A-Z, 0-9, underscore, dot, hyphen
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  return validPattern.test(username);
}

/**
 * Генерация уникального токена приглашения и создание ссылки на Telegram бота
 */
export async function generateTelegramInvite(
  params: GenerateInviteParams,
): Promise<Result<string>> {
  const { responseId, botUsername } = params;

  // Валидация botUsername
  if (!botUsername || botUsername.trim().length === 0) {
    return err("Не указан username Telegram бота");
  }

  if (!isValidTelegramUsername(botUsername)) {
    return err(
      "Неверный формат username Telegram (допустимы только латинские буквы, цифры, _, ., -)",
    );
  }

  logger.info("Генерация приглашения Telegram", { responseId });

  // Проверка существования токена
  const existingResponse = await tryCatch(async () => {
    return await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, responseId),
    });
  }, "Не удалось получить данные отклика");

  if (!existingResponse.success) {
    return err(existingResponse.error);
  }

  if (!existingResponse.data) {
    return err("Отклик не найден");
  }

  // Если токен уже существует, переиспользуем его
  if (existingResponse.data.telegramInviteToken) {
    const inviteLink = `https://t.me/${botUsername}?start=${existingResponse.data.telegramInviteToken}`;
    logger.info("Переиспользование существующего токена", {
      responseId,
      inviteLink,
    });
    return ok(inviteLink);
  }

  // Генерация нового уникального токена
  const token = randomBytes(16).toString("hex");

  // Сохранение токена в базу данных
  const updateResult = await tryCatch(async () => {
    await db
      .update(vacancyResponse)
      .set({ telegramInviteToken: token })
      .where(eq(vacancyResponse.id, responseId));
  }, "Не удалось сохранить токен приглашения");

  if (!updateResult.success) {
    return err(updateResult.error);
  }

  const inviteLink = `https://t.me/${botUsername}?start=${token}`;
  logger.info("Сгенерирован новый токен приглашения", {
    responseId,
    inviteLink,
  });

  return ok(inviteLink);
}

/**
 * Поиск отклика по токену приглашения
 */
export async function findResponseByInviteToken(
  token: string,
): Promise<Result<{ id: string; candidateName: string | null }>> {
  logger.info("Поиск отклика по токену приглашения", { token });

  const result = await tryCatch(async () => {
    return await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.telegramInviteToken, token),
    });
  }, "Не удалось найти отклик по токену");

  if (!result.success) {
    return err(result.error);
  }

  if (!result.data) {
    return err("Неверный или устаревший токен приглашения");
  }

  return ok({
    id: result.data.id,
    candidateName: result.data.candidateName,
  });
}
