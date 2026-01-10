/**
 * Валидация пин-кода для использования в оркестраторе интервью
 */

import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response as responseTable } from "@qbs-autonaim/db/schema";

/**
 * Проверяет валидность пин-кода в базе данных
 *
 * @param pinCode - 4-значный пин-код для проверки
 * @param workspaceId - ID workspace для проверки принадлежности (опционально)
 * @returns Объект с результатом валидации
 */
export async function validatePinCode(
  pinCode: string,
  workspaceId?: string,
): Promise<{
  valid: boolean;
  error?: string;
  responseId?: string;
  vacancyId?: string;
  candidateName?: string;
}> {
  try {
    // Проверяем формат пин-кода
    if (!pinCode || pinCode.length !== 4 || !/^\d{4}$/.test(pinCode)) {
      return {
        valid: false,
        error: "Неверный формат пин-кода. Должен быть 4 цифры",
      };
    }

    // Ищем отклик по пин-коду
    const response = await db.query.response.findFirst({
      where: and(
        eq(responseTable.telegramPinCode, pinCode),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    // Пин-код не найден
    if (!response) {
      return {
        valid: false,
        error: "Пин-код не найден в системе",
      };
    }

    // Загружаем вакансию отдельно для проверки workspace
    const vacancy = await db.query.vacancy.findFirst({
      where: (v, { eq }) => eq(v.id, response.entityId),
      columns: {
        id: true,
        title: true,
        workspaceId: true,
      },
    });

    // Проверяем принадлежность к workspace (если указан)
    if (workspaceId && (!vacancy || vacancy.workspaceId !== workspaceId)) {
      return {
        valid: false,
        error: "Пин-код не принадлежит данному workspace",
      };
    }

    // Пин-код валидный
    return {
      valid: true,
      responseId: response.id,
      vacancyId: response.entityId,
      candidateName: response.candidateName || undefined,
    };
  } catch (error) {
    console.error("Ошибка при валидации пин-кода:", error);
    return {
      valid: false,
      error: "Ошибка при проверке пин-кода",
    };
  }
}

/**
 * Быстрая проверка существования пин-кода (без дополнительных данных)
 * Используется для оптимизации когда нужна только валидация
 */
export async function isPinCodeValid(pinCode: string): Promise<boolean> {
  const result = await validatePinCode(pinCode);
  return result.valid;
}
