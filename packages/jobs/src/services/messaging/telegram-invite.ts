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
 * Генерация уникального 4-значного пин-кода для идентификации кандидата
 */
function generatePinCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Генерация уникального пин-кода для кандидата
 */
export async function generateTelegramInvite(
  params: GenerateInviteParams,
): Promise<Result<string>> {
  const { responseId } = params;

  logger.info("Генерация пин-кода для кандидата", { responseId });

  // Проверка существования пин-кода
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

  // Если пин-код уже существует, переиспользуем его
  if (existingResponse.data.telegramPinCode) {
    logger.info("Переиспользование существующего пин-кода", {
      responseId,
      pinCode: existingResponse.data.telegramPinCode,
    });
    return ok(existingResponse.data.telegramPinCode);
  }

  // Генерация нового уникального пин-кода
  let pinCode = generatePinCode();
  let attempts = 0;
  const maxAttempts = 10;

  // Проверяем уникальность пин-кода
  while (attempts < maxAttempts) {
    const existing = await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.telegramPinCode, pinCode),
    });

    if (!existing) {
      break;
    }

    pinCode = generatePinCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    return err("Не удалось сгенерировать уникальный пин-код");
  }

  // Сохранение пин-кода в базу данных
  const updateResult = await tryCatch(async () => {
    await db
      .update(vacancyResponse)
      .set({ telegramPinCode: pinCode })
      .where(eq(vacancyResponse.id, responseId));
  }, "Не удалось сохранить пин-код");

  if (!updateResult.success) {
    return err(updateResult.error);
  }

  logger.info("Сгенерирован новый пин-код", {
    responseId,
    pinCode,
  });

  return ok(pinCode);
}

/**
 * Поиск отклика по пин-коду
 */
export async function findResponseByPinCode(
  pinCode: string,
): Promise<Result<{ id: string; candidateName: string | null }>> {
  logger.info("Поиск отклика по пин-коду", { pinCode });

  const { findResponseByPinCode: findResponse } = await import(
    "@qbs-autonaim/db"
  );
  const result = await findResponse(pinCode);

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.data);
}
