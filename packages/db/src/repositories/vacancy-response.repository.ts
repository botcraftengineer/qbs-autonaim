import { eq } from "drizzle-orm";
import { db } from "../client";
import { vacancyResponse } from "../schema";

export interface ResponseByToken {
  id: string;
  candidateName: string | null;
}

/**
 * Поиск отклика по токену приглашения Telegram
 */
export async function findResponseByInviteToken(
  token: string,
): Promise<
  { success: true; data: ResponseByToken } | { success: false; error: string }
> {
  try {
    const response = await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.telegramInviteToken, token),
    });

    if (!response) {
      return {
        success: false,
        error: "Неверный или устаревший токен приглашения",
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
          : "Не удалось найти отклик по токену",
    };
  }
}
