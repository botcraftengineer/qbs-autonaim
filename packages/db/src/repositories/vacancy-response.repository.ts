import { eq } from "drizzle-orm";
import type { DbClient } from "../index";
import { vacancyResponse } from "../schema";

export interface ResponseByPinCode {
  id: string;
  candidateName: string | null;
}

/**
 * Поиск отклика по пин-коду
 */
export async function findResponseByPinCode(
  db: DbClient,
  pinCode: string,
): Promise<
  { success: true; data: ResponseByPinCode } | { success: false; error: string }
> {
  // Validate pinCode input
  const trimmedPinCode = pinCode?.trim();

  if (!trimmedPinCode) {
    return {
      success: false,
      error: "Пин-код не может быть пустым",
    };
  }

  if (trimmedPinCode.length !== 4) {
    return {
      success: false,
      error: "Пин-код должен содержать ровно 4 символа",
    };
  }

  if (!/^[A-Z0-9]{4}$/.test(trimmedPinCode)) {
    return {
      success: false,
      error: "Пин-код должен содержать только заглавные буквы и цифры",
    };
  }

  try {
    const response = await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.telegramPinCode, trimmedPinCode),
    });

    if (!response) {
      return {
        success: false,
        error: "Неверный пин-код",
      };
    }

    return {
      success: true,
      data: {
        id: response.id,
        candidateName: response.candidateName,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Не удалось найти отклик по пин-коду",
    };
  }
}
