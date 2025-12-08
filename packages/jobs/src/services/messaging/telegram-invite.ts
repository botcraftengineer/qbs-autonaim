import { randomBytes } from "node:crypto";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancyResponse } from "@qbs-autonaim/db/schema";
import { createLogger, err, ok, type Result, tryCatch } from "../base";

const logger = createLogger("TelegramInvite");

interface GenerateInviteParams {
  responseId: string;
  botUsername: string;
}

/**
 * Маскирование токена для безопасного логирования
 * Показывает первые 4 и последние 4 символа с многоточием посередине
 */
function maskToken(token: string): string {
  if (!token || token.length <= 8) {
    return "***";
  }
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

/**
 * Валидация формата username Telegram
 * Username должен содержать только латинские буквы, цифры и подчеркивания
 * Минимальная длина 5 символов
 */
function isValidTelegramUsername(username: string): boolean {
  if (!username || username.length < 5) {
    return false;
  }
  // Username Telegram: только a-z, A-Z, 0-9, подчеркивание (без точек и дефисов)
  const validPattern = /^[A-Za-z0-9_]{5,}$/;
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
      "Неверный формат username Telegram (допустимы только латинские буквы, цифры и _, минимум 5 символов)",
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
 * @deprecated Используйте findResponseByInviteToken из @qbs-autonaim/lib
 */
export async function findResponseByInviteToken(
  token: string,
): Promise<Result<{ id: string; candidateName: string | null }>> {
  logger.info("Поиск отклика по токену приглашения", {
    token: maskToken(token),
  });

  const { findResponseByInviteToken: findResponse } = await import(
    "@qbs-autonaim/lib"
  );
  const result = await findResponse(token);

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.data);
}
