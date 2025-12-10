import { eq } from "drizzle-orm";
import { db } from "../client";
import { vacancyResponse } from "../schema";

export interface ResponseByPinCode {
  id: string;
  candidateName: string | null;
}

/**
 * Поиск отклика по пин-коду
 */
export async function findResponseByPinCode(
  pinCode: string,
): Promise<
  { success: true; data: ResponseByPinCode } | { success: false; error: string }
> {
  try {
    const response = await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.telegramPinCode, pinCode),
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

/**
 * @deprecated Используйте findResponseByPinCode
 */
export async function findResponseByInviteToken(
  token: string,
): Promise<
  { success: true; data: ResponseByPinCode } | { success: false; error: string }
> {
  return {
    success: false,
    error: "Токены больше не используются, используйте пин-коды",
  };
}
